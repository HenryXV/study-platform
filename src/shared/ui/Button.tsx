'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        // Base styles
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-100 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50';

        // Variants
        const variants = {
            default: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-lg shadow-zinc-950/50',
            outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-100',
            ghost: 'hover:bg-zinc-800 text-zinc-100',
            danger: 'bg-red-950/20 text-red-200 border border-red-900/30 hover:bg-red-900/30',
            success: 'bg-emerald-950/20 text-emerald-200 border border-emerald-900/30 hover:bg-emerald-900/30'
        };

        // Sizes
        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg'
        };

        const variantStyles = variants[variant];
        const sizeStyles = sizes[size];

        const combinedClassName = `${baseStyles} ${variantStyles} ${sizeStyles} ${className}`;

        return (
            <button
                ref={ref}
                className={combinedClassName}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
