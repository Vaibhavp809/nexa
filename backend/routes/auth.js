import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new User({ username, email, password: hashed });
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
    const user = await User.findById(decoded.id).select('-password');
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
    const { username, preferredLanguage, bio, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { username, preferredLanguage, bio, avatar },
      { new: true }
    ).select('-password');

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
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
