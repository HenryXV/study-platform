'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/lib/utils';

interface ExplanationRevealProps {
    explanation?: string;
    unitId?: string;
    className?: string;
}

import { getUnitContent } from '../actions/get-unit-content';
import { Loader2, BookOpen } from 'lucide-react';

export function ExplanationReveal({ explanation, unitId, className }: ExplanationRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [sourceContent, setSourceContent] = useState<string | null>(null);
    const [sourceTitle, setSourceTitle] = useState<string | null>(null);
    const [isLoadingSource, setIsLoadingSource] = useState(false);
    const [showSource, setShowSource] = useState(false);

    const handleVerifySource = async () => {
        if (showSource) {
            setShowSource(false);
            return;
        }

        if (sourceContent) {
            setShowSource(true);
            return;
        }

        setIsLoadingSource(true);
        try {
            const result = await getUnitContent(unitId!);
            if (result.success) {
                setSourceContent(result.content || "");
                setSourceTitle(result.sourceTitle || null);
                setShowSource(true);
            }
        } catch (error) {
            console.error("Failed to fetch source", error);
        } finally {
            setIsLoadingSource(false);
        }
    };

    if (!explanation) return null;

    return (
        <div className={cn("w-full pt-4 border-t border-zinc-800/50 mt-4", className)}>
            {!isVisible ? (
                <button
                    onClick={() => setIsVisible(true)}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-indigo-400 transition-colors mx-auto group"
                    aria-expanded={false}
                    aria-controls="explanation-content"
                >
                    <Lightbulb className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                    <span>Reveal Explanation</span>
                    <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                </button>
            ) : (
                <div
                    id="explanation-content"
                    className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" />
                            Insight
                        </span>
                        <div className="flex items-center gap-2">
                            {unitId && (
                                <button
                                    onClick={handleVerifySource}
                                    disabled={isLoadingSource}
                                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-zinc-500 hover:text-emerald-400 disabled:opacity-50 transition-colors"
                                >
                                    {isLoadingSource ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <BookOpen className="w-3 h-3" />
                                    )}
                                    {showSource ? 'Hide Source' : 'Verify Source'}
                                </button>
                            )}
                            <button
                                onClick={() => setIsVisible(false)}
                                className="text-zinc-600 hover:text-zinc-400 p-1"
                            >
                                <ChevronUp className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-indigo-900/20">
                        {explanation}
                    </div>

                    {showSource && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="text-xs text-zinc-500 mb-2 font-medium flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                Source: {sourceTitle || 'Original Content'}
                            </div>
                            <blockquote className="pl-4 border-l-2 border-zinc-700 text-sm text-zinc-400 italic bg-zinc-900/30 py-2 rounded-r-lg">
                                {sourceContent}
                            </blockquote>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
