'use client';

import { useState, useTransition } from 'react';
import { saveRawContent } from '../actions/save-content';
import { Button } from '@/shared/ui/Button';

interface QuickAddFormProps {
    onSuccess?: () => void;
}

export function QuickAddForm({ onSuccess }: QuickAddFormProps) {
    const [content, setContent] = useState('');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setMessage(null);

        startTransition(async () => {
            const result = await saveRawContent(content);

            if (result.success) {
                setContent('');
                setMessage({ type: 'success', text: 'Saved!' });
                // Clear success message after 3 seconds
                setTimeout(() => {
                    setMessage(null);
                    onSuccess?.();
                }, 1000);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        });
    };

    return (
        <div className="w-full p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-medium text-zinc-100 mb-1">Quick Add</h3>
                    <p className="text-sm text-zinc-400">Capture raw notes for later processing.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste text, code, or ideas here..."
                    className="w-full h-48 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
                    disabled={isPending}
                    autoFocus
                />

                <div className="flex items-center justify-between pt-2">
                    <div className="flex-1">
                        {message && (
                            <span className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'} animate-pulse`}>
                                {message.text}
                            </span>
                        )}
                    </div>
                    <Button
                        type="submit"
                        disabled={isPending || !content.trim()}
                        isLoading={isPending}
                        size="sm"
                        title={!content.trim() ? "Enter some text to save" : "Save Note"}
                        className="disabled:cursor-not-allowed"
                    >
                        Save Note
                    </Button>
                </div>
            </form>
        </div>
    );
}
