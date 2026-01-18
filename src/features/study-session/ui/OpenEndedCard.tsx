'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { ExplanationReveal } from './ExplanationReveal';

interface OpenEndedCardProps {
    question: string;
    modelAnswer: string;
    isFlipped: boolean;
    onFlip: () => void;
    explanation?: string;
    unitId?: string;
}

export function OpenEndedCard({
    question,
    modelAnswer,
    isFlipped,
    onFlip,
    explanation,
    unitId
}: OpenEndedCardProps) {
    const [userAnswer, setUserAnswer] = useState('');
    const t = useTranslations('study.card');

    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-6 md:gap-12">
            {/* Question Header (Left Panel) */}
            <div className="flex-1 flex flex-col justify-center space-y-6 md:pr-6 md:border-r border-zinc-800/50">
                <div className="space-y-4">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 uppercase tracking-wider">
                        {t('openEnded')}
                    </span>
                    <h2 className="text-xl md:text-2xl font-medium text-zinc-100 leading-tight">
                        {question}
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col gap-6 min-h-0">

                {/* User Input (Always visible, but disabled when flipped maybe? Or read-only) */}
                <div className="flex-1 flex flex-col min-h-[150px]">
                    <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-2 font-mono">
                        {t('yourAnswer')}
                    </label>
                    <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        disabled={isFlipped}
                        placeholder={t('typePlaceholder')}
                        className={cn(
                            "w-full flex-1 bg-zinc-950 border rounded-lg p-4 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all resize-none font-sans leading-relaxed",
                            isFlipped ? "border-zinc-800 opacity-80" : "border-zinc-800 focus:border-indigo-500 focus:ring-indigo-900/50"
                        )}
                    />
                </div>

                {/* Model Answer (Revealed on Flip) */}
                {isFlipped && (
                    <div className="flex-1 flex flex-col min-h-[150px] animate-in slide-in-from-bottom-4 fade-in duration-500">
                        <label className="block text-xs uppercase tracking-wider text-green-400 mb-2 font-mono">
                            {t('modelAnswer')}
                        </label>
                        <div className="w-full flex-1 bg-zinc-900/50 border border-green-900/30 rounded-lg p-4 text-green-100/90 overflow-auto custom-scrollbar leading-relaxed shadow-[0_0_20px_-10px_rgba(16,185,129,0.1)]">
                            {modelAnswer}
                        </div>
                        <ExplanationReveal explanation={explanation} unitId={unitId} />
                    </div>
                )}
            </div>
        </div>
    );
}
