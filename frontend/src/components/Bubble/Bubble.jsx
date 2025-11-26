import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2, MessageSquare, FileText, Languages, StickyNote, Settings } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BubblePanel } from './BubblePanel';
import { clsx } from 'clsx';

const FEATURES = [
    { id: 'chat', icon: MessageSquare, label: 'Chat', color: 'text-blue-400' },
    { id: 'summarize', icon: FileText, label: 'Summarize', color: 'text-purple-400' },
    { id: 'translate', icon: Languages, label: 'Translate', color: 'text-pink-400' },
    { id: 'notes', icon: StickyNote, label: 'Notes', color: 'text-green-400' },
    { id: 'settings', icon: Settings, label: 'Settings', color: 'text-yellow-400' },
];

export default function Bubble() {
    const [position, setPosition] = useLocalStorage('nexa.bubble.position', { x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const [isEnabled, setIsEnabled] = useLocalStorage('nexa.bubble.enabled', true);
    const [showMenu, setShowMenu] = useState(false);
    const [activeFeature, setActiveFeature] = useState(null);
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

    // Handle text selection for auto-expand and prefill
    useEffect(() => {
        if (!isEnabled) return;

        const handleSelection = (e) => {
            // Don't trigger if clicking inside bubble or menu
            if (bubbleRef.current && bubbleRef.current.contains(e.target)) return;
            if (menuRef.current && menuRef.current.contains(e.target)) return;

            const selection = window.getSelection().toString().trim();
            if (selection.length > 8) {
                // Auto-open summarize feature if not already open
                if (!activeFeature) {
                    setActiveFeature('summarize');
                }
                // Trigger event for SummarizeTab to pick up
                window.dispatchEvent(new CustomEvent('nexa-text-selected', { detail: { text: selection } }));
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
                    <Bot className="w-8 h-8 text-neon-blue" />
                </div>
            </motion.div>
        );
    }

    const bubbleSize = 64;
    const iconSize = 48;
    const bubbleCenterX = position.x + bubbleSize / 2;
    const bubbleCenterY = position.y + bubbleSize / 2;
    
    // Detect screen position
    const isOnRightSide = bubbleCenterX > window.innerWidth / 2;
    const isOnLeftSide = !isOnRightSide;
    const isOnTopSide = bubbleCenterY < window.innerHeight / 2;
    const isOnBottomSide = !isOnTopSide;
    
    // Detect corners
    const cornerThreshold = 150; // Distance from edge to consider a corner
    const isNearTopCorner = isOnTopSide && (bubbleCenterY < cornerThreshold);
    const isNearBottomCorner = isOnBottomSide && (bubbleCenterY > window.innerHeight - cornerThreshold);
    const isNearRightCorner = isOnRightSide && (bubbleCenterX > window.innerWidth - cornerThreshold);
    const isNearLeftCorner = isOnLeftSide && (bubbleCenterX < cornerThreshold);
    
    // Adjust radius based on side (more spacing on right to prevent overlap)
    const radius = isOnRightSide ? 105 : 90;
    
    // Calculate menu direction with corner handling
    let menuStartAngle, menuEndAngle, menuSpan;
    
    if (isOnRightSide) {
        // Right side - open to left
        if (isNearTopCorner) {
            // Top-right corner: open downward-left (135° to 225°, but tighter span)
            menuStartAngle = (3 * Math.PI) / 4; // 135°
            menuEndAngle = (5 * Math.PI) / 4; // 225°
            menuSpan = Math.PI * 0.7; // Reduced span for tighter spacing (126° instead of 180°)
        } else if (isNearBottomCorner) {
            // Bottom-right corner: open upward-left (135° to 225°, but tighter span)
            menuStartAngle = (3 * Math.PI) / 4; // 135°
            menuEndAngle = (5 * Math.PI) / 4; // 225°
            menuSpan = Math.PI * 0.7; // Reduced span for tighter spacing
        } else {
            // Middle-right: open to left with tighter spacing
            menuStartAngle = (3 * Math.PI) / 4; // 135°
            menuEndAngle = (5 * Math.PI) / 4; // 225°
            menuSpan = Math.PI * 0.7; // Reduced span for tighter spacing between icons
        }
    } else {
        // Left side - open to right
        if (isNearTopCorner) {
            // Top-left corner: open downward-right (-45° to 45°, but tighter span)
            menuStartAngle = -Math.PI / 4; // -45°
            menuEndAngle = Math.PI / 4; // 45°
            menuSpan = Math.PI * 0.7; // Reduced span
        } else if (isNearBottomCorner) {
            // Bottom-left corner: open upward-right (-45° to 45°, but tighter span)
            menuStartAngle = -Math.PI / 4; // -45°
            menuEndAngle = Math.PI / 4; // 45°
            menuSpan = Math.PI * 0.7; // Reduced span
        } else {
            // Middle-left: open to right
            menuStartAngle = -Math.PI / 4; // -45°
            menuEndAngle = Math.PI / 4; // 45°
            menuSpan = Math.PI; // Full span for left side
        }
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
                                    {/* Tooltip on hover */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {feature.label}
                                        <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-black/90 rotate-45"></div>
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
                    "fixed pointer-events-auto z-50 glass-card shadow-neon flex flex-col overflow-hidden transition-colors duration-300",
                    activeFeature ? "bg-slate-900/95" : "bg-black/40 hover:bg-neon-blue/20 cursor-pointer"
                )}
                style={{ x: position.x, y: position.y }}
            >
                {/* Bubble Icon */}
                {!activeFeature && (
                    <div
                        className="w-full h-full flex items-center justify-center cursor-move"
                        onClick={toggleMenu}
                    >
                        <div className="relative flex items-center justify-center">
                            <Bot className="w-8 h-8 text-neon-blue" />
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
