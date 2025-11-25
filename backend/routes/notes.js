import express from 'express';
import Note from '../models/Note.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware to verify token
const verifyToken = (req, res, next) => {
    let token = req.cookies.nexa_token;

    if (!token) {
        const auth = req.headers.authorization;
        if (auth) token = auth.split(' ')[1];
    }

    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Get all notes
router.get('/', verifyToken, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create note
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, color, isPinned } = req.body;
        const note = new Note({
            userId: req.userId,
            title,
            content,
            color,
            isPinned
        });
        await note.save();
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update note
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, content, color, isPinned } = req.body;
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { title, content, color, isPinned },
            { new: true }
        );
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete note
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
