import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, securityQuestion, securityAnswer } = req.body;
    if (!username || !email || !password || !securityQuestion || !securityAnswer) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    
    // Hash security answer
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), salt);
    
    const user = new User({ 
      username, 
      email, 
      password: hashed,
      securityQuestion,
      securityAnswer: hashedAnswer
    });
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Set httpOnly cookie for extension
    res.cookie('nexa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected test route - reads from cookie OR Authorization header
router.get('/me', async (req, res) => {
  try {
    // Try to get token from cookie first, then Authorization header
    let token = req.cookies.nexa_token;

    if (!token) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ message: 'No token' });
      token = auth.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -securityAnswer');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Update Profile
router.put('/profile', async (req, res) => {
  try {
    // Get token from cookie or header
    let token = req.cookies.nexa_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ message: 'No token' });
      token = auth.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { username, email, preferredLanguage, avatar } = req.body;

    const updateData = { username, preferredLanguage, avatar };
    
    // If email is being changed, check if it's unique
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== decoded.id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(
      decoded.id,
      updateData,
      { new: true }
    ).select('-password -securityAnswer');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Profile (alias for /me but specific for profile page)
router.get('/profile', async (req, res) => {
  try {
    let token = req.cookies.nexa_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ message: 'No token' });
      token = auth.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password -securityAnswer');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Forgot Password - Send reset code
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If the email exists, a reset code has been sent' });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save code to user
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    // TODO: Send email with reset code
    // For now, we'll just return it in development
    // In production, use a service like SendGrid, Nodemailer, etc.
    if (process.env.NODE_ENV === 'development') {
      console.log(`Reset code for ${email}: ${resetCode}`);
    }

    // TODO: Implement email sending
    // await sendResetCodeEmail(email, resetCode);

    res.json({ message: 'If the email exists, a reset code has been sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password - Verify code and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    // Check if code matches and hasn't expired
    if (user.resetPasswordCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }

    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change Password (for logged-in users) - requires security question answer
router.post('/change-password', async (req, res) => {
  try {
    let token = req.cookies.nexa_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ message: 'No token' });
      token = auth.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { securityAnswer, newPassword } = req.body;
    
    if (!securityAnswer || !newPassword) {
      return res.status(400).json({ message: 'Security answer and new password are required' });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify security answer
    const isMatch = await bcrypt.compare(securityAnswer.toLowerCase().trim(), user.securityAnswer);
    if (!isMatch) {
      return res.status(400).json({ message: 'Security answer is incorrect' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    user.password = hashed;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Security Question (for password change)
router.get('/security-question', async (req, res) => {
  try {
    let token = req.cookies.nexa_token;
    if (!token) {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ message: 'No token' });
      token = auth.split(' ')[1];
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('securityQuestion');
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ securityQuestion: user.securityQuestion });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
