import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  preferredLanguage: { type: String, default: 'en' },
  avatar: { type: String, default: '' },
  securityQuestion: { type: String, required: true },
  securityAnswer: { type: String, required: true }, // Will be hashed
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
