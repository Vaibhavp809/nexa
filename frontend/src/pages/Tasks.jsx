import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader, CheckCircle2, Circle, Trash2, Edit2, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '../hooks/useLocalStorage';
import api from '../api';
import { useTranslation } from '../hooks/useTranslation';

export default function Tasks() {
    const [tasks, setTasks] = useLocalStorage('nexa.tasks', []);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const { t } = useTranslation();

    // Try to fetch from backend, fallback to localStorage
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Try backend first
            const response = await api.get('/tasks');
            if (response.data && Array.isArray(response.data)) {
                setTasks(response.data);
            }
        } catch (err) {
            // Backend doesn't exist or error - use localStorage
            console.log('Tasks backend not available, using localStorage');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTask = async (taskData) => {
        try {
            let updatedTasks;
            
            if (taskData._id) {
                // Update existing task
                try {
                    const response = await api.put(`/tasks/${taskData._id}`, taskData);
                    updatedTasks = tasks.map(t => t._id === taskData._id ? response.data : t);
                } catch (err) {
                    // Fallback to localStorage
                    updatedTasks = tasks.map(t => 
                        t.id === taskData.id ? { ...taskData, updatedAt: new Date().toISOString() } : t
                    );
                }
            } else {
                // Create new task
                try {
                    const response = await api.post('/tasks', taskData);
                    updatedTasks = [response.data, ...tasks];
                } catch (err) {
                    // Fallback to localStorage
                    const newTask = {
                        ...taskData,
                        id: Date.now().toString(),
                        createdAt: new Date().toISOString(),
                    };
                    updatedTasks = [newTask, ...tasks];
                }
            }
            
            setTasks(updatedTasks);
            setIsEditorOpen(false);
            setEditingTask(null);
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;

        try {
            try {
                await api.delete(`/tasks/${taskId}`);
            } catch (err) {
                // Backend doesn't exist - continue with localStorage
            }
            setTasks(tasks.filter(t => t.id !== taskId && t._id !== taskId));
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const handleToggleComplete = async (task) => {
        const updatedTask = { ...task, completed: !task.completed };
        await handleSaveTask(updatedTask);
    };

    const openEditor = (task = null) => {
        setEditingTask(task);
        setIsEditorOpen(true);
    };

    const filteredTasks = tasks.filter(task =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const incompleteTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 overflow-visible"
                >
                    <div className="flex items-start gap-4 mb-4 overflow-visible">
                        <h1 className="text-4xl md:text-5xl font-bold heading-gradient leading-tight py-1 overflow-visible">
                            {t('pages.tasks.title')}
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">{t('pages.tasks.subtitle')}</p>
                </motion.div>

                <div className="flex flex-col md:flex-row justify-end items-center mb-12 gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder={t('pages.tasks.searchPlaceholder')}
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
                        {/* Incomplete Tasks */}
                        {incompleteTasks.length > 0 && (
                            <div className="mb-12">
                                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                                    Pending ({incompleteTasks.length})
                                </h2>
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {incompleteTasks.map(task => (
                                            <TaskCard
                                                key={task.id || task._id}
                                                task={task}
                                                onToggle={handleToggleComplete}
                                                onEdit={openEditor}
                                                onDelete={handleDeleteTask}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Completed Tasks */}
                        {completedTasks.length > 0 && (
                            <div>
                                {incompleteTasks.length > 0 && (
                                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                                        Completed ({completedTasks.length})
                                    </h2>
                                )}
                                <div className="space-y-3 opacity-60">
                                    <AnimatePresence>
                                        {completedTasks.map(task => (
                                            <TaskCard
                                                key={task.id || task._id}
                                                task={task}
                                                onToggle={handleToggleComplete}
                                                onEdit={openEditor}
                                                onDelete={handleDeleteTask}
                                            />
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {tasks.length === 0 && !loading && (
                            <div className="text-center py-20 opacity-50">
                                <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                                    <CheckCircle2 size={40} className="text-gray-400" />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-300">No tasks yet</h3>
                                <p className="text-gray-500 mt-2">Click the + button to create your first task</p>
                            </div>
                        )}
                    </>
                )}

                {/* Task Editor Modal */}
                {isEditorOpen && (
                    <TaskEditor
                        task={editingTask}
                        onClose={() => {
                            setIsEditorOpen(false);
                            setEditingTask(null);
                        }}
                        onSave={handleSaveTask}
                    />
                )}
            </div>
        </div>
    );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={task.completed 
                ? "bg-white/5 border border-white/5 rounded-lg p-4 flex items-start gap-3 line-through" 
                : "bg-white/5 border border-white/10 rounded-lg p-4 flex items-start gap-3 hover:bg-white/10 transition-colors"
            }
        >
            <button
                onClick={() => onToggle(task)}
                className="mt-1 flex-shrink-0"
            >
                {task.completed ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                    <Circle className="text-gray-400" size={20} />
                )}
            </button>
            <div className="flex-1 min-w-0">
                <h3 className={task.completed ? "text-gray-500" : "text-white font-medium"}>
                    {task.title}
                </h3>
                {task.description && (
                    <p className={task.completed ? "text-gray-600 text-sm mt-1" : "text-gray-400 text-sm mt-1"}>
                        {task.description}
                    </p>
                )}
                {task.dueDate && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button
                    onClick={() => onEdit(task)}
                    className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={() => onDelete(task.id || task._id)}
                    className="p-2 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    );
}

function TaskEditor({ task, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        completed: false,
        ...task
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;
        onSave({
            ...formData,
            _id: task?._id,
            id: task?.id,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
                <h2 className="text-xl font-bold mb-4">
                    {task ? 'Edit Task' : 'New Task'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="w-full input-field"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Description</label>
                        <textarea
                            value={formData.description || ''}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full input-field h-24 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Due Date</label>
                        <input
                            type="date"
                            value={formData.dueDate || ''}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full input-field"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.completed}
                            onChange={e => setFormData({ ...formData, completed: e.target.checked })}
                            className="w-4 h-4"
                            id="completed"
                        />
                        <label htmlFor="completed" className="text-sm text-gray-400">Completed</label>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}



