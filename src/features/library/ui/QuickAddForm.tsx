'use client';

import { useState, useTransition } from 'react';
import { saveRawContent } from '../actions/save-content';

export function QuickAddForm() {
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
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: result.message });
            }
        });
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="mb-4">
                <h3 className="text-lg font-medium text-zinc-100 mb-1">Quick Add</h3>
                <p className="text-sm text-zinc-400">Capture raw notes for later processing.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste text, code, or ideas here..."
                    className="w-full h-48 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
                    disabled={isPending}
                />

                <div className="flex items-center justify-between">
                    <div className="h-6 flex items-center gap-4">
                        {message && (
                            <span className={`text-sm ${message.type === 'success' ? 'text-emerald-400' : 'text-red-400'} animate-pulse`}>
                                {message.text}
                            </span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isPending || !content.trim()}
                        className="px-4 py-2 bg-zinc-100 text-zinc-900 font-medium rounded-md hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPending ? 'Saving...' : 'Save Note'}
                    </button>
                </div>
            </form>
        </div>
    );
}
