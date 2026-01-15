'use client';

import { useState, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronRight, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { UnitQuestionsList } from './UnitQuestionsList';
import { generateQuestionsPreview } from '../actions/generate-questions-preview';
import { commitQuestions } from '../actions/commit-questions';
import { QuestionSupervisor } from './QuestionSupervisor';
import { Question } from '../schemas/question-generator';
import { toast } from 'sonner';

interface StudyUnit {
    id: string;
    type: 'TEXT' | 'CODE';
    content: string; // Title/Concept Name
    questions: { id: string; type: string; data: import('@/features/study-session/data/flash-cards').QuestionData }[];
}

interface GeneratedUnitsListProps {
    units: StudyUnit[];
    expandedUnits: Set<string>;
    onToggle: (unitId: string) => void;
    onDelete: (unitId: string) => Promise<void>;
}

export function GeneratedUnitsList({ units, expandedUnits, onToggle, onDelete }: GeneratedUnitsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Generation State
    const [draftQuestions, setDraftQuestions] = useState<Question[] | null>(null);
    const [draftUnitId, setDraftUnitId] = useState<string | null>(null);
    const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

    const handleDeleteInit = (id: string) => {
        setDeletingId(id);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        await onDelete(deletingId);
        setIsDeleting(false);
        setDeletingId(null);
    };

    const handleDeleteCancel = () => {
        setDeletingId(null);
    };

    const handleGenerateClick = async (unit: StudyUnit) => {
        setIsGeneratingId(unit.id);
        try {
            const result = await generateQuestionsPreview(unit.id, unit.content, unit.type);
            if (result.success && result.questions) {
                setDraftQuestions(result.questions);
                setDraftUnitId(unit.id);
            } else {
                toast.error(result.message || "Failed to generate questions");
            }
        } catch (error) {
            toast.error("An error occurred starting generation");
        } finally {
            setIsGeneratingId(null);
        }
    };

    const handleSupervisorCommit = async (finalQuestions: Question[], deletedIds: string[]) => {
        if (!draftUnitId) return;

        const toastId = toast.loading("Saving questions...");
        try {
            const result = await commitQuestions(draftUnitId, finalQuestions);
            if (result.success) {
                toast.success(`added ${result.count} questions to library`, { id: toastId });
                setDraftQuestions(null);
                setDraftUnitId(null);
            } else {
                toast.error(result.message || "Failed to save questions", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to commit questions", { id: toastId });
        }
    };

    // Prevent propagation when clicking actions
    const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }, []);

    if (units.length === 0) {
        return <p className="text-sm text-zinc-500 italic p-4">No units found.</p>;
    }

    return (
        <>
            <ConfirmModal
                isOpen={!!deletingId}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Unit"
                message="Are you sure you want to delete this unit? All associated questions will also be removed."
                confirmText="Delete Unit"
                isLoading={isDeleting}
            />

            {draftQuestions && (
                <QuestionSupervisor
                    initialQuestions={draftQuestions}
                    onCancel={() => { setDraftQuestions(null); setDraftUnitId(null); }}
                    onCommit={handleSupervisorCommit}
                />
            )}

            <div className="space-y-3 pb-20">
                {units.map((unit) => {
                    const isExpanded = expandedUnits.has(unit.id);
                    const isGenerating = isGeneratingId === unit.id;

                    return (
                        <Card key={unit.id} className="group hover:border-zinc-700 transition-all shadow-sm overflow-hidden">
                            {/* Header / Main Content */}
                            <div className="flex items-start justify-between p-4 gap-3">
                                {/* Main Expand Toggle - Now a proper button */}
                                <button
                                    onClick={() => onToggle(unit.id)}
                                    className="flex flex-col gap-2 overflow-hidden flex-1 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 rounded-lg -m-2 p-2 hover:bg-zinc-900/40 transition-colors"
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="h-5 w-5 flex items-center justify-center text-zinc-500">
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wider ${unit.type === 'CODE'
                                                ? 'text-purple-400 border-purple-900/40 bg-purple-950/40'
                                                : 'text-blue-400 border-blue-900/40 bg-blue-950/40'
                                                }`}
                                        >
                                            {unit.type}
                                        </Badge>
                                        <span className="text-xs text-zinc-500 font-mono select-none">ID: {unit.id.slice(-4)}</span>
                                    </div>
                                    <p className="text-sm text-zinc-200 font-medium leading-normal pl-8">
                                        {unit.content}
                                    </p>
                                </button>

                                <div className={`flex items-center gap-1 transition-all ${isGenerating ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-950/20"
                                        onClick={(e) => handleActionClick(e, () => handleGenerateClick(unit))}
                                        disabled={isGenerating}
                                        aria-label="Generate questions"
                                    >
                                        {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Generate
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => handleActionClick(e, () => handleDeleteInit(unit.id))}
                                        className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                        title="Delete Unit"
                                        aria-label="Delete unit"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>

                            {/* Expanded Questions Area */}
                            {isExpanded && (
                                <div className="border-t border-zinc-800 bg-zinc-950/30 p-4 pt-2">
                                    <UnitQuestionsList unitId={unit.id} questions={unit.questions || []} />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        </>
    );
}
