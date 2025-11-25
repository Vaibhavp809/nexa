import React from 'react';
import { Edit2, Trash2, Pin } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NoteCard({ note, onEdit, onDelete }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative group p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
            style={{ backgroundColor: note.color || '#1e293b' }}
            onClick={() => onEdit(note)}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white line-clamp-1">{note.title}</h3>
                {note.isPinned && <Pin size={16} className="text-yellow-400 fill-current" />}
            </div>

            <p className="text-gray-300 text-sm line-clamp-4 whitespace-pre-wrap mb-8">
                {note.content}
            </p>

            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(note); }}
                    className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(note._id); }}
                    className="p-2 rounded-full bg-black/20 hover:bg-red-500/80 text-white transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </motion.div>
    );
}
