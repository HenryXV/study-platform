'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { cn } from '@/lib/utils';

interface ExplanationRevealProps {
    explanation?: string;
    className?: string;
}

export function ExplanationReveal({ explanation, className }: ExplanationRevealProps) {
    const [isVisible, setIsVisible] = useState(false);

    if (!explanation) return null;

    return (
        <div className={cn("w-full pt-4 border-t border-zinc-800/50 mt-4", className)}>
            {!isVisible ? (
                <button
                    onClick={() => setIsVisible(true)}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-indigo-400 transition-colors mx-auto group"
                >
                    <Lightbulb className="w-4 h-4 group-hover:text-indigo-400 transition-colors" />
                    <span>Reveal Explanation</span>
                    <ChevronDown className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
                </button>
            ) : (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-2">
                            <Lightbulb className="w-3 h-3" />
                            Insight
                        </span>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-zinc-600 hover:text-zinc-400 p-1"
                        >
                            <ChevronUp className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="text-sm text-zinc-400 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-indigo-900/20">
                        {explanation}
                    </div>
                </div>
            )}
        </div>
    );
}
