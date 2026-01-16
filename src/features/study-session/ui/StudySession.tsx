"use client";

import { Button } from '@/shared/ui/Button';
import { CodeCard } from '../components/CodeCard';
import { MultipleChoiceCard } from '../components/MultipleChoiceCard';
import { OpenEndedCard } from '../components/OpenEndedCard';
import { ExplanationReveal } from '../components/ExplanationReveal';
import { CompletionView } from '../components/CompletionView';
import { FlashCard } from '../data/flash-cards';
import { useStudySession } from '../hooks/useStudySession';
import { Flame } from 'lucide-react';

export function StudySession({
    mode = 'maintenance',
    initialCards
}: {
    mode?: string;
    initialCards: FlashCard[]
}) {
    const {
        currentCard,
        isComplete,
        isFlipped,
        progress,
        handleFlip,
        handleNext,
        handleExtendSession
    } = useStudySession(initialCards);

    if (isComplete) {
        return (
            <CompletionView
                count={progress.total}
                onExtend={handleExtendSession}
            />
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-6 flex flex-col items-center min-h-[50vh] relative">
            {/* Crisis Banner */}
            {mode === 'crisis' && (
                <div className="absolute -top-12 left-0 right-0 bg-red-950/30 border border-red-900/50 text-red-200 px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium animate-in slide-in-from-top-4">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span>Crisis Mode Active: Just {progress.total} cards to keep the streak!</span>
                </div>
            )}

            {/* Header */}
            <div className="w-full mb-8 flex justify-between items-start text-sm text-zinc-500 font-mono">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <span>Active Session</span>
                        <span className={`px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold ${mode === 'deep' ? 'bg-orange-950/30 text-orange-400 border border-orange-900/30' :
                            mode === 'crisis' ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30' :
                                'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                            Mode: {mode}
                        </span>
                        {currentCard.isReviewAhead && (
                            <span className="px-2 py-0.5 rounded text-xs uppercase tracking-wider font-semibold bg-indigo-950/30 text-indigo-400 border border-indigo-900/30">
                                Reviewing Ahead
                            </span>
                        )}
                    </div>
                    {/* Taxonomy Tags */}
                    {(currentCard.subject || (currentCard.topics && currentCard.topics.length > 0)) && (
                        <div className="flex items-center gap-2 mt-1">
                            {currentCard.subject && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${currentCard.subject.color}`}>
                                    {currentCard.subject.name}
                                </span>
                            )}
                            {currentCard.topics?.map((topic, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                                    #{topic.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <span>Card {progress.current} of {progress.total}</span>
            </div>

            {/* Card Arena */}
            <div className="w-full flex-1 flex flex-col relative mb-8" aria-live="polite">
                <div className={`
          relative w-full flex-1 flex flex-col items-center justify-center p-12
          bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl
        `}>
                    <div className="flex-1 flex items-center justify-center p-4">
                        {currentCard.type === 'CODE' ? (
                            <CodeCard
                                question={currentCard.question}
                                initialCode={currentCard.codeSnippet}
                                expectedAnswer={currentCard.answer}
                                isFlipped={isFlipped}
                                explanation={currentCard.explanation}
                                unitId={currentCard.unitId}
                            />
                        ) : currentCard.type === 'MULTI_CHOICE' ? (
                            <MultipleChoiceCard
                                question={currentCard.question}
                                options={currentCard.options || []}
                                correctAnswer={currentCard.answer}
                                isFlipped={isFlipped}
                                onAnswer={(selected) => {
                                    handleFlip();
                                }}
                                explanation={currentCard.explanation}
                                unitId={currentCard.unitId}
                            />
                        ) : currentCard.type === 'OPEN' ? (
                            <OpenEndedCard
                                question={currentCard.question}
                                modelAnswer={currentCard.answer}
                                isFlipped={isFlipped}
                                onFlip={handleFlip}
                                explanation={currentCard.explanation}
                                unitId={currentCard.unitId}
                            />
                        ) : (
                            // STANDARD CARD UI (TEXT)
                            !isFlipped ? (
                                // FRONT
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-2xl md:text-3xl font-medium text-zinc-100 leading-tight">
                                        {currentCard.question}
                                    </h3>
                                </div>
                            ) : (
                                // BACK
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                                    <span className="text-xs uppercase tracking-widest text-green-400 font-semibold">Expected Answer</span>
                                    <div className="text-xl md:text-2xl text-zinc-100 font-medium">
                                        {currentCard.answer}
                                    </div>
                                    <ExplanationReveal explanation={currentCard.explanation} unitId={currentCard.unitId} />
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full h-20 flex items-center justify-center">
                {!isFlipped ? (
                    <Button
                        onClick={handleFlip}
                        size="lg"
                        className="w-full max-w-sm h-auto py-4 font-semibold shadow-lg shadow-zinc-950/50"
                    >
                        Show Answer
                    </Button>
                ) : (
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                        <Button
                            onClick={() => handleNext('FORGOT')}
                            variant="danger"
                            className="h-auto py-3 flex-col"
                        >
                            Forgot
                        </Button>
                        <Button
                            onClick={() => handleNext('HARD')}
                            variant="outline"
                            className="h-auto py-3 flex-col bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                        >
                            Hard
                        </Button>
                        <Button
                            onClick={() => handleNext('EASY')}
                            variant="success"
                            className="h-auto py-3 flex-col"
                        >
                            Easy
                        </Button>
                    </div>
                )}
            </div>
        </div >
    );
}
