import React, { useState, useEffect } from 'react';
import { Bell, Clock, X, CheckCircle2 } from 'lucide-react';
import api from '../api';
import { motion } from 'framer-motion';

export default function Notifications() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            await fetchTasks();
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!loading) {
            checkTaskReminders();
        }
    }, [tasks, loading]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tasks');
            const tasks = res.data || res || [];
            setTasks(Array.isArray(tasks) ? tasks : []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setTasks([]);
        } finally {
            setLoading(false);
        }
    };

    const checkTaskReminders = () => {
        if (!Array.isArray(tasks) || tasks.length === 0) {
            setNotifications([]);
            return;
        }
        
        const now = new Date();
        const newNotifications = [];
        
        tasks.forEach(task => {
            if (task && task.dueDate && !task.completed) {
                try {
                    const dueDate = new Date(task.dueDate);
                    if (!isNaN(dueDate.getTime())) {
                        const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
                        const daysUntilDue = hoursUntilDue / 24;
                        
                        if (hoursUntilDue <= 24 && hoursUntilDue >= 0) {
                            newNotifications.push({
                                id: task._id || task.id || `task-${Date.now()}-${Math.random()}`,
                                type: 'task',
                                title: task.title || 'Untitled Task',
                                message: `Task "${task.title || 'Untitled'}" is due ${daysUntilDue < 1 ? 'today' : `in ${Math.ceil(daysUntilDue)} day(s)`}`,
                                dueDate: task.dueDate,
                                task: task,
                                timestamp: now
                            });
                        }
                    }
                } catch (err) {
                    console.error('Error processing task:', err);
                }
            }
        });
        
        setNotifications(newNotifications.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)));
    };

    const handleMarkComplete = async (task) => {
        try {
            await api.put(`/tasks/${task._id}`, {
                ...task,
                completed: true
            });
            fetchTasks();
        } catch (err) {
            console.error('Error updating task:', err);
        }
    };

    const handleDismiss = (notificationId) => {
        setNotifications(notifications.filter(n => n.id !== notificationId));
    };

    return (
        <div className="min-h-screen bg-black text-white pt-28 pb-12 px-6 md:px-12">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                    </div>
                    <p className="text-gray-400 ml-0">Task reminders and updates</p>
                </motion.div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">
                        Loading notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <Bell className="mx-auto mb-4 text-gray-500" size={48} />
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">No notifications</h3>
                        <p className="text-gray-500">You're all caught up! No upcoming task reminders.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="glass-card p-6 border border-orange-500/30 bg-orange-500/10"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className="p-3 bg-orange-500/20 rounded-full">
                                            <Clock className="text-orange-400" size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-orange-400 mb-1">
                                                Task Reminder
                                            </h3>
                                            <p className="text-white font-semibold mb-1">
                                                {notification.task.title}
                                            </p>
                                            <p className="text-gray-300 text-sm mb-2">
                                                {notification.message}
                                            </p>
                                            {notification.task.description && (
                                                <p className="text-gray-400 text-xs mb-3">
                                                    {notification.task.description}
                                                </p>
                                            )}
                                            <p className="text-orange-300 text-xs">
                                                Due: {new Date(notification.dueDate).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleMarkComplete(notification.task)}
                                            className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors"
                                            title="Mark as complete"
                                        >
                                            <CheckCircle2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDismiss(notification.id)}
                                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 transition-colors"
                                            title="Dismiss"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

