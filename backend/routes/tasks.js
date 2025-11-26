import express from 'express';
import Task from '../models/Task.js';
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

// Get all tasks for the user
router.get('/', verifyToken, async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        console.error('Error fetching tasks:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new task
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, description, completed, dueDate } = req.body;
        
        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const task = new Task({
            userId: req.userId,
            title: title.trim(),
            description: description || '',
            completed: completed || false,
            dueDate: dueDate || null
        });
        
        await task.save();
        res.json(task);
    } catch (err) {
        console.error('Error creating task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a task
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const { title, description, completed, dueDate } = req.body;
        
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (completed !== undefined) updateData.completed = completed;
        if (dueDate !== undefined) updateData.dueDate = dueDate || null;

        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            updateData,
            { new: true }
        );
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.json(task);
    } catch (err) {
        console.error('Error updating task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a task
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });
        
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        
        res.json({ message: 'Task deleted', task });
    } catch (err) {
        console.error('Error deleting task:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;


