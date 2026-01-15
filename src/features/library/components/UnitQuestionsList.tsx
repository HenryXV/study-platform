import { useState } from 'react';
import { generateQuestionsForUnit } from '../actions/generate-questions';
import { Loader2, Plus, BrainCircuit, Check, Trash2, X } from 'lucide-react';
import { QuestionData } from '@/features/study-session/data/flash-cards';
import { deleteQuestion } from '../actions/delete-question';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

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
    const router = useRouter();

    // State
    const [isGenerating, setIsGenerating] = useState(false);

    // Deletion State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const handleGenerate = async () => {
        setIsGenerating(true);
        await generateQuestionsForUnit(unitId);
        setIsGenerating(false);
        router.refresh(); // Force re-fetch
    };

    const handleDeleteClick = (questionId: string) => {
        setItemToDelete(questionId);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        await deleteQuestion(itemToDelete);
        setIsDeleting(false);
        setShowDeleteModal(false);
        setItemToDelete(null);
        router.refresh();
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    return (
        <div className="pl-4 pr-2 py-3 border-l-2 border-zinc-800 ml-2 space-y-3">
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Question"
                message="Are you sure you want to delete this question? This cannot be undone."
                confirmText="Delete"
                isLoading={isDeleting}
            />

            {initialQuestions.length > 0 && (
                <div className="space-y-2">
                    {initialQuestions.map((q) => (
                        <div key={q.id} className="group relative p-3 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-zinc-300 hover:border-zinc-700 transition-colors">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold px-1 rounded uppercase tracking-wider ${q.type === 'MULTI_CHOICE' ? 'text-cyan-400 bg-cyan-950/30' :
                                            q.type === 'SNIPPET' ? 'text-pink-400 bg-pink-950/30' :
                                                'text-amber-400 bg-amber-950/30'
                                            }`}
                                    >
                                        {q.type}
                                    </Badge>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(q.id)}
                                    className="opacity-0 group-hover:opacity-100 h-6 w-6 hover:bg-red-950/30 text-zinc-500 hover:text-red-400 transition-all absolute right-2 top-2"
                                    title="Delete question"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                            <p className="font-medium text-zinc-200 pr-6 mt-2">{q.data.question}</p>
                        </div>
                    ))}
                </div>
            )}

            <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors pl-0 hover:bg-transparent"
            >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                {initialQuestions.length === 0 ? "Generate Quiz Questions" : "Generate More"}
            </Button>
        </div>
    );
}
