'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming this exists, if not i'll standard class string concat

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    showCloseButton?: boolean;
}

export function Modal({
    isOpen,
    onClose,
    children,
    className,
    showCloseButton = true
}: ModalProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle animation state
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            // Prevent scrolling on body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            // Restore styles if no other modals are open ?? for now simple restore is fine
        };
    }, [isOpen, onClose]);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div
            className={cn(
                "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200",
                isOpen ? "opacity-100" : "opacity-0"
            )}
            role="dialog"
            aria-modal="true"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Content */}
            <div className={cn(
                "relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-200",
                isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4",
                className
            )}>
                {showCloseButton && (
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all z-50"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {children}
            </div>
        </div>,
        document.body
    );
}
