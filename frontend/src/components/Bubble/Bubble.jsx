import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Maximize2, Minimize2 } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { BubblePanel } from './BubblePanel';
import { clsx } from 'clsx';

export default function Bubble() {
    const [position, setPosition] = useLocalStorage('nexa.bubble', { x: window.innerWidth - 80, y: window.innerHeight - 80 });
    const [isExpanded, setIsExpanded] = useState(false);
    const constraintsRef = useRef(null);

    const toggleExpand = () => setIsExpanded(!isExpanded);

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-40" />

            <motion.div
                drag
                dragMomentum={false}
                dragConstraints={constraintsRef}
                initial={position}
                onDragEnd={(e, info) => {
                    setPosition({ x: info.point.x, y: info.point.y });
                }}
                animate={{
                    width: isExpanded ? 350 : 64,
                    height: isExpanded ? 500 : 64,
                    borderRadius: isExpanded ? 16 : 32,
                }}
                className={clsx(
                    "fixed pointer-events-auto z-50 glass-card shadow-neon flex flex-col overflow-hidden transition-colors duration-300",
                    isExpanded ? "bg-slate-900/90" : "bg-black/40 hover:bg-neon-blue/20 cursor-pointer"
                )}
                style={{ x: position.x, y: position.y }} // Use style for position to avoid re-render loop with drag
            >
                {/* Header / Handle */}
                <div
                    className={clsx(
                        "flex items-center justify-between p-3 cursor-move",
                        isExpanded ? "border-b border-white/10" : "h-full justify-center"
                    )}
                    onClick={!isExpanded ? toggleExpand : undefined}
                >
                    <div className="flex items-center gap-2">
                        <div className={clsx("relative flex items-center justify-center", isExpanded ? "w-8 h-8" : "w-full h-full")}>
                            <Bot className={clsx("text-neon-blue transition-all", isExpanded ? "w-6 h-6" : "w-8 h-8")} />
                            {!isExpanded && (
                                <span className="absolute inset-0 rounded-full animate-pulse-slow ring-1 ring-neon-blue/50" />
                            )}
                        </div>
                        {isExpanded && <span className="font-bold text-white">Nexa</span>}
                    </div>

                    {isExpanded && (
                        <div className="flex gap-1">
                            <button onClick={toggleExpand} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                <Minimize2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 overflow-hidden"
                        >
                            <BubblePanel isOpen={isExpanded} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </>
    );
}
