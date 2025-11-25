import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function IconButton({
    icon: Icon,
    className,
    variant = 'primary',
    size = 'md',
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50";

    const variants = {
        primary: "bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/20 hover:shadow-neon",
        secondary: "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10",
        ghost: "hover:bg-white/5 text-gray-400 hover:text-white",
    };

    const sizes = {
        sm: "p-1.5",
        md: "p-2",
        lg: "p-3",
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], sizes[size], className)}
            {...props}
        >
            <Icon className="w-5 h-5" />
        </button>
    );
}
