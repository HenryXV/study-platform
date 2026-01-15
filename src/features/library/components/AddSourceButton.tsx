'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Plus, X } from 'lucide-react';
import { QuickAddForm } from '@/features/library/ui/QuickAddForm';

export function AddSourceButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add New
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
                    <div className="relative w-full max-w-2xl animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* We reuse the existing QuickAddForm but might want to ensure it handles "success" nicely by closing */}
                        <div className="shadow-2xl shadow-black/50 rounded-xl overflow-hidden">
                            <QuickAddForm onSuccess={() => setIsOpen(false)} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
