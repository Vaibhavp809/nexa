import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Button({
    children,
    variant = 'primary',
    className,
    isLoading,
    icon: Icon,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900";

    const variants = {
        primary: "bg-neon-blue/10 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/20 hover:shadow-neon focus:ring-neon-blue",
        secondary: "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 focus:ring-gray-500",
        danger: "bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500/20 focus:ring-red-500",
        ghost: "hover:bg-white/5 text-gray-400 hover:text-white border-transparent",
    };

    return (
        <button
            className={twMerge(baseStyles, variants[variant], className)}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : Icon ? (
                <Icon className="w-4 h-4 mr-2" />
            ) : null}
            {children}
        </button>
    );
}
