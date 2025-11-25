import React, { useState, useEffect } from 'react';
import { X, Save, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = [
    '#1e293b', // Default Slate
    '#451a03', // Amber
    '#172554', // Blue
    '#064e3b', // Emerald
    '#4c0519', // Rose
    '#312e81', // Indigo
    '#4a044e', // Fuchsia
];

export default function NoteEditor({ note, isOpen, onClose, onSave }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [isPinned, setIsPinned] = useState(false);

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
            setColor(note.color || COLORS[0]);
            setIsPinned(note.isPinned || false);
        } else {
            setTitle('');
            setContent('');
            setColor(COLORS[0]);
            setIsPinned(false);
        }
    }, [note, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            _id: note?._id,
            title,
            content,
            color,
            isPinned
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                    style={{ backgroundColor: color }}
                >
                    <form onSubmit={handleSubmit} className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <input
                                type="text"
                                placeholder="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent text-2xl font-bold text-white placeholder-white/40 outline-none w-full"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setIsPinned(!isPinned)}
                                className={`p-2 rounded-full transition-colors ${isPinned ? 'text-yellow-400 bg-white/10' : 'text-white/40 hover:text-white'}`}
                            >
                                <Pin size={20} className={isPinned ? 'fill-current' : ''} />
                            </button>
                        </div>

                        <textarea
                            placeholder="Take a note..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-64 bg-transparent text-gray-200 placeholder-white/30 outline-none resize-none text-lg leading-relaxed"
                            required
                        />

                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
                            <div className="flex gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setColor(c)}
                                        className={`w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
