'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isLoading = false,
    variant = 'danger'
}: ConfirmModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={isLoading ? () => { } : onClose} showCloseButton={!isLoading}>
            <div className="p-6">
                <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full shrink-0 ${variant === 'danger' ? 'bg-red-950/50 text-red-500' : 'bg-amber-950/50 text-amber-500'
                        }`}>
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-zinc-100 mb-2 leading-none mt-1">
                            {title}
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-950/50 px-6 py-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <Button
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-zinc-400 hover:text-zinc-200"
                >
                    {cancelText}
                </Button>
                <Button
                    variant={variant === 'danger' ? 'danger' : 'default'}
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="min-w-[80px]"
                >
                    {isLoading ? 'Processing...' : confirmText}
                </Button>
            </div>
        </Modal>
    );
}
