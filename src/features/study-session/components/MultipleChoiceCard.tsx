'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { ExplanationReveal } from './ExplanationReveal';

interface MultipleChoiceCardProps {
    question: string;
    options: string[];
    correctAnswer: string;
    isFlipped: boolean;
    onAnswer: (selected: string) => void;
    explanation?: string;
    unitId?: string;
}

export function MultipleChoiceCard({
    question,
    options,
    correctAnswer,
    isFlipped,
    onAnswer,
    explanation,
    unitId
}: MultipleChoiceCardProps) {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    // Reset local state when question changes (implied by isFlipped processing or parent key) 
    // BUT here we might reuse the component. Ideally parent uses key={card.id}.

    const handleSelect = (option: string) => {
        if (isFlipped) return; // Prevent changing after reveal
        setSelectedOption(option);
        onAnswer(option);
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8">
            {/* Question Header */}
            <div className="text-center space-y-4">
                <span className="text-xs font-bold px-2 py-1 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 uppercase tracking-wider">
                    Multiple Choice
                </span>
                <h2 className="text-2xl md:text-3xl font-medium text-zinc-100 leading-tight">
                    {question}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {options.map((option, index) => {
                    const isSelected = selectedOption === option;
                    const isCorrect = option === correctAnswer;

                    let stateStyles = "bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-300";
                    let icon = null;

                    if (isFlipped) {
                        if (isCorrect) {
                            stateStyles = "bg-emerald-950/60 border-emerald-500/50 text-emerald-200 shadow-glow-emerald";
                            icon = <Check className="w-5 h-5 text-emerald-400" />;
                        } else if (isSelected && !isCorrect) {
                            stateStyles = "bg-red-950/60 border-red-500/50 text-red-200 opacity-80";
                            icon = <X className="w-5 h-5 text-red-400" />;
                        } else {
                            stateStyles = "bg-zinc-900/30 border-zinc-800/30 text-zinc-600 opacity-50";
                        }
                    } else if (isSelected) {
                        stateStyles = "bg-zinc-700 border-zinc-500 text-white ring-1 ring-zinc-500";
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(option)}
                            disabled={isFlipped}
                            className={cn(
                                "relative p-4 md:p-6 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group",
                                stateStyles,
                                !isFlipped && "hover:-translate-y-0.5"
                            )}
                        >
                            <span className="text-sm md:text-base font-medium pr-4">{option}</span>
                            {icon}
                        </button>
                    );
                })}
            </div>

            {isFlipped && (
                <div className="text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <p className="text-zinc-500 text-sm mb-4">
                        {selectedOption === correctAnswer
                            ? "Correct! Well done."
                            : "Incorrect. Review the answer above."}
                    </p>
                    <ExplanationReveal explanation={explanation} unitId={unitId} />
                </div>
            )}
        </div>
    );
}
