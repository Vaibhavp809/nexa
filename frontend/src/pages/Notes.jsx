import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NoteCard from '../components/Notes/NoteCard';
import NoteEditor from '../components/Notes/NoteEditor';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingNote, setEditingNote] = useState(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:4000/api/notes', {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setNotes(response.data);
        } catch (error) {
            console.error('Error fetching notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNote = async (noteData) => {
        try {
            const token = localStorage.getItem('token');
            const config = {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            };

            if (noteData._id) {
                // Update existing note
                const response = await axios.put(
                    `http://localhost:4000/api/notes/${noteData._id}`,
                    noteData,
                    config
                );
                setNotes(notes.map(n => n._id === noteData._id ? response.data : n));
            } else {
                // Create new note
                const response = await axios.post(
                    'http://localhost:4000/api/notes',
                    noteData,
                    config
                );
                setNotes([response.data, ...notes]);
            }
            setIsEditorOpen(false);
            setEditingNote(null);
        } catch (error) {
            console.error('Error saving note:', error);
        }
    };

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:4000/api/notes/${noteId}`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true
            });
            setNotes(notes.filter(n => n._id !== noteId));
        } catch (error) {
            console.error('Error deleting note:', error);
        }
    };

    const openEditor = (note = null) => {
        setEditingNote(note);
        setIsEditorOpen(true);
    };

    const filteredNotes = notes.filter(note =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const pinnedNotes = filteredNotes.filter(n => n.isPinned);
    const otherNotes = filteredNotes.filter(n => !n.isPinned);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pt-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
                            My Notes
                        </h1>
                        <p className="text-gray-400">Capture your ideas and thoughts</p>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        <button
                            onClick={() => openEditor()}
                            className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader className="animate-spin text-blue-500" size={40} />
                    </div>
                ) : (
                    <>
                        {/* Pinned Notes */}
                        {pinnedNotes.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Pinned</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <AnimatePresence>
                                        {pinnedNotes.map(note => (
                                            <NoteCard
                                                key={note._id}
                                                note={note}
                                                onEdit={openEditor}
                                                onDelete={handleDeleteNote}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Other Notes */}
                        {otherNotes.length > 0 && (
                            <div>
                                {pinnedNotes.length > 0 && (
                                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Others</h2>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <AnimatePresence>
                                        {otherNotes.map(note => (
                                            <NoteCard
                                                key={note._id}
                                                note={note}
                                                onEdit={openEditor}
                                                onDelete={handleDeleteNote}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {notes.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-50">
                                <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                                    <Plus size={40} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-300">No notes yet</h3>
                                <p className="text-gray-500 mt-2">Click the + button to create your first note</p>
                            </div>
                        )}
                    </>
                )}

                <NoteEditor
                    isOpen={isEditorOpen}
                    onClose={() => setIsEditorOpen(false)}
                    onSave={handleSaveNote}
                    note={editingNote}
                />
            </div>
        </div>
    );
}
