import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, MessageSquare, FileText, Languages, StickyNote, Settings, Sparkles, Zap, CircleDot, Mic, Search, Calendar } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BubblePanel } from './BubblePanel';
import { clsx } from 'clsx';
import api from '../../api';

const BUBBLE_ICONS = {
    bot: Bot,
    sparkles: Sparkles,
    zap: Zap,
    circle: CircleDot,
};

const FEATURES = [
    { id: 'summarize', icon: FileText, label: 'Summarize', color: 'text-purple-400' },
    { id: 'translate', icon: Languages, label: 'Translate', color: 'text-pink-400' },
    { id: 'quicknotes', icon: StickyNote, label: 'Quick Notes', color: 'text-green-400' },
    { id: 'voicenotes', icon: Mic, label: 'Voice Notes', color: 'text-blue-400' },
    { id: 'voicesearch', icon: Search, label: 'Voice Search', color: 'text-cyan-400' },
    { id: 'tasks', icon: Calendar, label: 'Tasks', color: 'text-orange-400' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'text-yellow-400' },
];

export default function Bubble() {
    const [position, setPosition] = useLocalStorage('nexa.bubble.position', { x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const [isEnabled, setIsEnabled] = useLocalStorage('nexa.bubble.enabled', true);
    const [bubbleIconType, setBubbleIconType] = useLocalStorage('nexa.bubble.icon', 'bot');
    const [showMenu, setShowMenu] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);
    const [taskReminder, setTaskReminder] = useState(null);
    
    const BubbleIcon = BUBBLE_ICONS[bubbleIconType] || Bot;
    const constraintsRef = useRef(null);
    const bubbleRef = useRef(null);
    const menuRef = useRef(null);

    const toggleMenu = () => {
        if (!isEnabled) return;
        setShowMenu(!showMenu);
        if (showMenu) {
            setActiveFeature(null);
        }
    };

    const openFeature = (featureId) => {
        setActiveFeature(featureId);
        setShowMenu(false);
    };

    const closePanel = () => {
        setActiveFeature(null);
    };

    // Handle task reminder notifications
    useEffect(() => {
        const handleTaskReminder = (e) => {
            if (e.detail?.task) {
                setTaskReminder(e.detail.task);
                // Auto-hide after 10 seconds
                setTimeout(() => setTaskReminder(null), 10000);
            }
        };

        window.addEventListener('nexa-task-reminder', handleTaskReminder);
        
        // Also check tasks periodically
        const checkTasks = async () => {
            try {
                const res = await api.get('/tasks');
                const tasks = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
                if (tasks.length > 0) {
                    const now = new Date();
                    tasks.forEach(task => {
                        if (task && task.dueDate && !task.completed) {
                            const dueDate = new Date(task.dueDate);
                            const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
                            if (hoursUntilDue <= 24 && hoursUntilDue > 0) {
                                window.dispatchEvent(new CustomEvent('nexa-task-reminder', {
                                    detail: { task }
                                }));
                            }
                        }
                    });
                }
            } catch (err) {
                // Silently fail - tasks endpoint might not be available
            }
        };
        
        // Check immediately and then every minute
        checkTasks();
        const interval = setInterval(checkTasks, 60000);
        
        return () => {
            window.removeEventListener('nexa-task-reminder', handleTaskReminder);
            clearInterval(interval);
        };
    }, []);

    // Handle text selection for auto-expand and prefill
    useEffect(() => {
        if (!isEnabled) return;

        const handleSelection = (e) => {
            // Don't trigger if clicking inside bubble or menu
            if (bubbleRef.current && bubbleRef.current.contains(e.target)) return;
            if (menuRef.current && menuRef.current.contains(e.target)) return;

            const selection = window.getSelection().toString().trim();
            if (selection.length > 8) {
                // Only trigger if summarize feature is already active
                if (activeFeature === 'summarize') {
                    // Trigger event for SummarizeTab to pick up
                    window.dispatchEvent(new CustomEvent('nexa-text-selected', { detail: { text: selection } }));
                }
            }
        };

        document.addEventListener('mouseup', handleSelection);
        return () => document.removeEventListener('mouseup', handleSelection);
    }, [isEnabled, activeFeature]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showMenu && menuRef.current && !menuRef.current.contains(e.target) && bubbleRef.current && !bubbleRef.current.contains(e.target)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showMenu]);

    // Keep position within viewport bounds and handle window resize
    useEffect(() => {
        const updatePosition = () => {
            let newX = position.x;
            let newY = position.y;
            
            if (newX < 0) newX = 0;
            if (newY < 0) newY = 0;
            if (newX > window.innerWidth - 64) newX = window.innerWidth - 64;
            if (newY > window.innerHeight - 64) newY = window.innerHeight - 64;
            
            if (newX !== position.x || newY !== position.y) {
                setPosition({ x: newX, y: newY });
            }
        };
        
        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, []);

    if (!isEnabled) {
        // Show but disabled - don't disappear
        return (
            <motion.div
                ref={bubbleRef}
                className="fixed pointer-events-auto z-50 glass-card opacity-30 cursor-not-allowed"
                style={{ 
                    x: position.x, 
                    y: position.y,
                    width: 64,
                    height: 64,
                }}
            >
                <div className="w-full h-full flex items-center justify-center">
                    <BubbleIcon className="w-8 h-8 text-neon-blue" />
                </div>
            </motion.div>
        );
    }

    const bubbleSize = 64;
    const iconSize = 48;
    const bubbleCenterX = position.x + bubbleSize / 2;
    const bubbleCenterY = position.y + bubbleSize / 2;
    
    // Detect screen position
    const screenCenterX = window.innerWidth / 2;
    const screenCenterY = window.innerHeight / 2;
    const centerThreshold = 200; // Distance from center to still be considered "center"
    
    const distanceFromCenterX = Math.abs(bubbleCenterX - screenCenterX);
    const isInCenter = distanceFromCenterX < centerThreshold;
    const isOnRightSide = bubbleCenterX > screenCenterX + centerThreshold;
    const isOnLeftSide = bubbleCenterX < screenCenterX - centerThreshold;
    
    // Set radius based on position
    const radius = isOnRightSide ? 105 : 90;
    
    // Calculate menu direction based on bubble position
    let menuStartAngle, menuEndAngle, menuSpan;
    
    if (isInCenter) {
        // Center: display semicircle in top half (spread around)
        menuStartAngle = -Math.PI / 2; // -90° (up)
        menuEndAngle = Math.PI / 2; // 90° (down)
        menuSpan = Math.PI; // 180 degrees (full semicircle)
    } else if (isOnRightSide) {
        // Right side: display options on left side of bubble (semicircle opening left)
        menuStartAngle = (3 * Math.PI) / 4; // 135° (top-left)
        menuEndAngle = (5 * Math.PI) / 4; // 225° (bottom-left)
        menuSpan = Math.PI * 0.75; // 135 degrees for tighter spacing
    } else {
        // Left side: display options on right side of bubble (semicircle opening right)
        menuStartAngle = -Math.PI / 4; // -45° (top-right)
        menuEndAngle = Math.PI / 4; // 45° (bottom-right)
        menuSpan = Math.PI * 0.75; // 135 degrees for tighter spacing
    }

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />


            {/* Semi-circle Menu */}
            <AnimatePresence>
                {showMenu && !activeFeature && (
                    <motion.div
                        ref={menuRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed z-50 pointer-events-none"
                        style={{
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        {FEATURES.map((feature, index) => {
                            const Icon = feature.icon;
                            // Calculate position in semicircle opening towards center of screen
                            const angle = menuStartAngle + (menuSpan / (FEATURES.length - 1)) * index;
                            // Calculate icon position relative to bubble center
                            let iconX = bubbleCenterX + Math.cos(angle) * radius - iconSize / 2;
                            let iconY = bubbleCenterY + Math.sin(angle) * radius - iconSize / 2;
                            
                            // Keep icons within viewport bounds
                            iconX = Math.max(5, Math.min(iconX, window.innerWidth - iconSize - 5));
                            iconY = Math.max(5, Math.min(iconY, window.innerHeight - iconSize - 5));

                            // Determine tooltip position based on bubble position
                            // If bubble is on left side → show tooltips on right side of icons (away from bubble)
                            // If bubble is on right side → show tooltips on left side of icons (away from bubble)
                            // If bubble is in center → show based on available space
                            let tooltipOnLeft;
                            if (isOnLeftSide) {
                                // Bubble on left: show tooltips on right side of icons
                                tooltipOnLeft = false;
                            } else if (isOnRightSide) {
                                // Bubble on right: show tooltips on left side of icons
                                tooltipOnLeft = true;
                            } else {
                                // Bubble in center: choose based on space
                                const iconCenterX = iconX + iconSize / 2;
                                const spaceOnRight = window.innerWidth - iconCenterX;
                                const spaceOnLeft = iconCenterX;
                                tooltipOnLeft = spaceOnLeft < spaceOnRight;
                            }
                            const tooltipOnRight = !tooltipOnLeft;

                            return (
                                <motion.div
                                    key={feature.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                        scale: 1, 
                                        opacity: 1,
                                    }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
                                    className="fixed group pointer-events-auto"
                                    style={{
                                        left: iconX,
                                        top: iconY,
                                        width: iconSize,
                                        height: iconSize,
                                    }}
                                >
                                    <button
                                        onClick={() => openFeature(feature.id)}
                                        onMouseEnter={(e) => e.stopPropagation()}
                                        className={clsx(
                                            "w-full h-full rounded-full glass-card border-2 border-white/20",
                                            "hover:border-neon-blue/50 hover:scale-110 transition-all duration-200",
                                            "flex items-center justify-center shadow-lg cursor-pointer",
                                            "backdrop-blur-sm"
                                        )}
                                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
                                    >
                                        <Icon className={clsx("w-6 h-6", feature.color)} />
                                    </button>
                                    {/* Tooltip on hover - positioned sideways */}
                                    <div className={clsx(
                                        "absolute top-1/2 -translate-y-1/2 px-3 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10",
                                        tooltipOnLeft ? "right-full mr-2" : "left-full ml-2"
                                    )}>
                                        {feature.label}
                                        {/* Arrow pointing to the icon */}
                                        <div className={clsx(
                                            "absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 rotate-45",
                                            tooltipOnLeft ? "-right-1" : "-left-1"
                                        )}></div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Bubble */}
            <motion.div
                ref={bubbleRef}
                drag
                dragMomentum={false}
                dragConstraints={constraintsRef}
                initial={position}
                onDragStart={() => {
                    // Close menu when dragging starts
                    if (showMenu) {
                        setShowMenu(false);
                    }
                }}
                onDragEnd={(e, info) => {
                    // Keep within viewport bounds
                    const panelWidth = activeFeature ? 380 : bubbleSize;
                    const panelHeight = activeFeature ? 500 : bubbleSize;
                    let x = Math.max(0, Math.min(info.point.x, window.innerWidth - panelWidth));
                    let y = Math.max(0, Math.min(info.point.y, window.innerHeight - panelHeight));
                    setPosition({ x, y });
                }}
                animate={{
                    width: activeFeature ? 380 : bubbleSize,
                    height: activeFeature ? 500 : bubbleSize,
                    borderRadius: activeFeature ? 16 : 32,
                }}
                className={clsx(
                    "fixed pointer-events-auto z-50 glass-card shadow-neon flex flex-col overflow-visible transition-colors duration-300",
                    activeFeature ? "bg-slate-900/95" : "bg-black/40 hover:bg-neon-blue/20 cursor-pointer"
                )}
                style={{ x: position.x, y: position.y }}
            >
                {/* Task Reminder Notification - Attached to Bubble */}
                <AnimatePresence>
                    {taskReminder && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                            className="absolute pointer-events-auto z-[60] whitespace-nowrap"
                            style={{
                                top: '-65px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                minWidth: '180px',
                                maxWidth: '250px'
                            }}
                        >
                            <div className="bg-orange-500/20 border-2 border-orange-500/50 rounded-lg px-3 py-2 shadow-lg backdrop-blur-sm">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-white font-semibold truncate">
                                            {taskReminder.title} - Due today
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setTaskReminder(null)}
                                        className="text-gray-400 hover:text-white flex-shrink-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bubble Icon */}
                {!activeFeature && (
                    <div
                        className="w-full h-full flex items-center justify-center cursor-move"
                        onClick={toggleMenu}
                    >
                        <div className="relative flex items-center justify-center">
                            <BubbleIcon className="w-8 h-8 text-neon-blue" />
                            <span className="absolute inset-0 rounded-full animate-pulse-slow ring-1 ring-neon-blue/50" />
                        </div>
                    </div>
                )}

                {/* Feature Panel */}
                <AnimatePresence>
                    {activeFeature && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col h-full"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between p-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const Feature = FEATURES.find(f => f.id === activeFeature);
                                        const Icon = Feature?.icon || Bot;
                                        return <Icon className={clsx("w-5 h-5", Feature?.color || "text-neon-blue")} />;
                                    })()}
                                    <span className="font-bold text-white">
                                        {FEATURES.find(f => f.id === activeFeature)?.label || 'Nexa'}
                                    </span>
                                </div>
                                <button 
                                    onClick={closePanel} 
                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Panel Content */}
                            <div className="flex-1 overflow-hidden">
                                <BubblePanel isOpen={true} activeTab={activeFeature} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}
