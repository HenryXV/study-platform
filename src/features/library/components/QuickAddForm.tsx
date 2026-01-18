'use client';

import { useState, useTransition } from 'react';
import { saveRawContent } from '../actions/save-content';
import { uploadSourceFile } from '../actions/upload-source-file';
import { Button } from '@/shared/ui/Button';

interface QuickAddFormProps {
    onSuccess?: () => void;
}

export function QuickAddForm({ onSuccess }: QuickAddFormProps) {
    const [activeTab, setActiveTab] = useState<'note' | 'pdf'>('note');
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (activeTab === 'note') {
            if (!content.trim()) return;
            startTransition(async () => {
                const result = await saveRawContent(content);
                handleResult(result);
            });
        } else {
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            startTransition(async () => {
                const result = await uploadSourceFile(formData);
                handleResult(result);
            });
        }
    };

    const handleResult = (result: { success: boolean; message: string }) => {
        if (result.success) {
            setContent('');
            setFile(null);
            setMessage({ type: 'success', text: 'Saved!' });
            setTimeout(() => {
                setMessage(null);
                onSuccess?.();
            }, 1000);
        } else {
            setMessage({ type: 'error', text: result.message });
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            setFile(droppedFile);
            setMessage(null);
        } else if (droppedFile) {
            setMessage({ type: 'error', text: 'Only PDF files are supported' });
        }
    };

    return (
        <div className="w-full p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-zinc-100 mb-1">Quick Add</h3>
                    <p className="text-sm text-zinc-400">Capture ideas or upload sources.</p>
                </div>
                <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('note')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'note'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Write Note
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pdf')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'pdf'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Upload PDF
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'note' ? (
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste text, code, or ideas here..."
                        className="w-full h-48 p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 resize-none font-mono text-sm"
                        disabled={isPending}
                        autoFocus
                    />
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        className={`w-full h-48 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-colors ${isDragOver
                            ? 'border-zinc-500 bg-zinc-900/50'
                            : 'border-zinc-800 bg-zinc-950'
                            }`}
                    >
                        {file ? (
                            <div className="text-center p-4">
                                <p className="text-zinc-200 font-medium mb-1">{file.name}</p>
                                <p className="text-zinc-500 text-xs mb-3">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    className="text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <div className="text-center p-4">
                                <p className="text-zinc-400 text-sm mb-2">Drag & drop PDF here</p>
                                <p className="text-zinc-600 text-xs mb-4">- or -</p>
                                <label className="cursor-pointer">
                                    <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-md text-xs text-zinc-300 hover:text-zinc-100 transition-colors">
                                        Browse Files
                                    </span>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="hidden"
                                        onChange={(e) => {
                                            const selected = e.target.files?.[0];
                                            if (selected) setFile(selected);
                                            e.target.value = ''; // Reset input
                                        }}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                )}

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
                        disabled={isPending || (activeTab === 'note' ? !content.trim() : !file)}
                        isLoading={isPending}
                        size="sm"
                        className="disabled:cursor-not-allowed"
                    >
                        {activeTab === 'note' ? 'Save Note' : 'Upload PDF'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
