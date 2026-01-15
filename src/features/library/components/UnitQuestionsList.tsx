'use client';

import { useState, useTransition } from 'react';
import { generateQuestionsForUnit } from '../actions/generate-questions';
import { Loader2, Plus, BrainCircuit, Check } from 'lucide-react';
import { QuestionData } from '@/features/study-session/data/flash-cards';

interface Question {
    id: string;
    type: string;
    data: QuestionData;
}

interface UnitQuestionsListProps {
    unitId: string;
    questions: Question[];
}

export function UnitQuestionsList({ unitId, questions: initialQuestions }: UnitQuestionsListProps) {
    const [questions, setQuestions] = useState(initialQuestions);
    const [isPending, startTransition] = useTransition();

    // Removed useEffect prop syncing. Parent should use key={unitId} or router.refresh() 
    // effectively remounts/updates this component if data changes from server.

    const handleGenerate = () => {
        startTransition(async () => {
            const result = await generateQuestionsForUnit(unitId);
            if (result.success) {
                // In a real app we might re-fetch or rely on a server-action returning the new list.
                // For now, we rely on router.refresh() from the action to update the parent prop, 
                // but since this state is initialized from props, we might need a way to sync.
                // HACK: For this sprint, rely on router.refresh() triggers re-render of parent -> new props.
                // We'll trust the parent re-render updates the key or component.
            }
        });
    };

    return (
        <div className="pl-4 pr-2 py-3 border-l-2 border-zinc-800 ml-2 space-y-3">
            {questions.length > 0 && (
                <div className="space-y-2">
                    {questions.map((q) => (
                        <div key={q.id} className="p-3 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-zinc-300">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-bold px-1 rounded ${q.type === 'MULTI_CHOICE' ? 'text-cyan-400 bg-cyan-950/30' :
                                    q.type === 'SNIPPET' ? 'text-pink-400 bg-pink-950/30' :
                                        'text-amber-400 bg-amber-950/30'
                                    }`}>
                                    {q.type}
                                </span>
                            </div>
                            <p className="font-medium text-zinc-200">{q.data.question}</p>
                            {/* Detailed view could go here, for now just the prompt */}
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
            >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                {questions.length === 0 ? "Generate Quiz Questions" : "Generate More"}
            </button>
        </div>
    );
}
