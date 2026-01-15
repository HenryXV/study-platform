'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { processContent } from '../actions/process-content';
import { GeneratedUnitsList } from './GeneratedUnitsList';

interface SourceInspectorProps {
    source: {
        id: string;
        title: string;
        bodyText: string;
        status: 'UNPROCESSED' | 'PROCESSED';
        units?: Array<{ id: string; type: 'TEXT' | 'CODE'; content: string }>;
    };
}

export function SourceInspector({ source }: SourceInspectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; message?: string; count?: number } | null>(null);

    const handleProcess = () => {
        setResult(null);
        startTransition(async () => {
            const res = await processContent(source.id);
            if (res.success) {
                setResult({ success: true, count: res.count });
                router.refresh(); // Refresh to reflect status change if any
            } else {
                setResult({ success: false, message: res.message });
            }
        });
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6 h-[calc(100vh-100px)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-100 mb-2 truncate">{source.title}</h1>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${source.status === 'PROCESSED'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                        : 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                        }`}>
                        {source.status}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono">{source.id}</span>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                {/* Left: Content Viewer */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden">
                    <div className="bg-zinc-950/50 p-3 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Raw Content</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {source.bodyText}
                        </pre>
                    </div>
                </div>

                {/* Right: Actions or Results */}
                <div className="lg:col-span-1 space-y-6 flex flex-col h-full min-h-0">
                    {source.status === 'PROCESSED' && source.units ? (
                        <GeneratedUnitsList units={source.units} />
                    ) : (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-lg font-medium text-zinc-100 mb-4">AI Processor</h3>
                            <p className="text-sm text-zinc-400 mb-6">
                                Atomize this content into study units. The AI will extract concepts and create flashcards.
                            </p>

                            {result && (
                                <div className={`mb-4 p-3 rounded-lg text-sm border ${result.success
                                    ? 'bg-emerald-950/30 text-emerald-300 border-emerald-900/30'
                                    : 'bg-red-950/30 text-red-300 border-red-900/30'
                                    }`}>
                                    {result.success
                                        ? `Successfully generated ${result.count} units!`
                                        : `Error: ${result.message}`}
                                </div>
                            )}

                            <button
                                onClick={handleProcess}
                                disabled={isPending}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    'Analyze & Atomize'
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
