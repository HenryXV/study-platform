import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BrainCircuit, X, Edit2, Check, Trash2, CheckSquare } from 'lucide-react';
import { QuestionData } from '@/features/study-session/data/flash-cards';
import { deleteQuestion } from '../actions/delete-question';
import { deleteQuestionsBulk } from '../actions/delete-questions-bulk';

import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { EditableQuestion } from '@/features/library/schemas/question-generator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Question {
    id: string;
    type: string;
    data: QuestionData;
}

interface UnitQuestionsListProps {
    unitId: string;
    questions: Question[];
    onOpenEditor?: (unitId: string, questions: EditableQuestion[]) => void;
}

export function UnitQuestionsList({ unitId, questions: initialQuestions, onOpenEditor }: UnitQuestionsListProps) {
    const router = useRouter();
    const t = useTranslations('library.questions');
    const tCommon = useTranslations('common');

    // Single deletion state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Selection helpers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(initialQuestions.map(q => q.id)));
    const clearSelection = () => setSelectedIds(new Set());

    const exitSelectionMode = () => {
        setSelectionMode(false);
        clearSelection();
    };

    const editorT = useTranslations('library.editor');

    const handleEditClick = () => {
        if (onOpenEditor) {
            const editableQuestions: EditableQuestion[] = initialQuestions.map(q => {
                const options = q.type === 'MULTI_CHOICE'
                    ? (q.data as any).options // The data layer is loosely typed in this context, but we know it exists for MCQ
                    : undefined;

                return {
                    id: q.id,
                    type: q.type === 'MULTI_CHOICE' ? 'MULTIPLE_CHOICE' : (q.type === 'SNIPPET' ? 'CODE' : 'OPEN'),
                    questionText: q.data.question,
                    correctAnswer: q.data.answer,
                    options: options,
                    explanation: (q.data as any).explanation || '',
                    topics: []
                };
            });
            onOpenEditor(unitId, editableQuestions);
        }
    };

    // Mapping for internal types to translation keys
    const typeMapping: Record<string, string> = {
        'MULTI_CHOICE': 'MULTIPLE_CHOICE',
        'SNIPPET': 'CODE'
    };

    // Single delete handlers
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

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        const toastId = toast.loading(tCommon('processing'));

        try {
            const result = await deleteQuestionsBulk(Array.from(selectedIds));
            if (result.success) {
                toast.success(result.message || t('questionsCount', { count: result.count ?? 0 }), { id: toastId });
                exitSelectionMode();
                router.refresh();
            } else {
                toast.error(result.message || tCommon('error'), { id: toastId });
            }
        } catch (error) {
            toast.error(tCommon('error'), { id: toastId });
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteModal(false);
        }
    };





    return (
        <div className="pl-4 pr-2 py-3 border-l-2 border-zinc-800 ml-2 space-y-3">
            {/* Single Delete Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t('deleteTitle')}
                message={t('deleteMessage')}
                confirmText={tCommon('delete')}
                isLoading={isDeleting}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title={t('deleteBulkTitle')}
                message={t('deleteBulkMessage', { count: selectedIds.size })}
                confirmText={t('deleteBulkConfirm', { count: selectedIds.size })}
                isLoading={isBulkDeleting}
            />

            {initialQuestions.length > 0 && (
                <>
                    {/* Question List Header */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-zinc-500">{t('questionsCount', { count: initialQuestions.length })}</span>

                        <div className="flex items-center gap-2">


                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (selectionMode) {
                                        exitSelectionMode();
                                    } else {
                                        setSelectionMode(true);
                                        // Auto-select first item
                                        if (initialQuestions.length > 0) {
                                            setSelectedIds(new Set([initialQuestions[0].id]));
                                        }
                                    }
                                }}
                                className={cn(
                                    "text-xs h-6 px-2 gap-1",
                                    selectionMode
                                        ? "text-zinc-400"
                                        : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                                )}
                            >
                                {selectionMode ? (
                                    <>
                                        <X size={12} />
                                        {tCommon('cancel')}
                                    </>
                                ) : (
                                    <>
                                        <CheckSquare size={12} />
                                        {tCommon('select')}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {initialQuestions.map((q) => {
                            const isSelected = selectedIds.has(q.id);
                            const translatedType = editorT(`types.${typeMapping[q.type] || 'OPEN'}`);

                            return (
                                <div
                                    key={q.id}
                                    className={cn(
                                        "group relative p-3 bg-zinc-900/50 border border-zinc-800 rounded text-sm text-zinc-300 hover:border-zinc-700 transition-colors",
                                        isSelected && "border-indigo-500/50 bg-indigo-950/10"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Selection Checkbox */}
                                        {selectionMode && (
                                            <button
                                                type="button"
                                                onClick={() => toggleSelection(q.id)}
                                                className={cn(
                                                    'h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                                    isSelected
                                                        ? 'bg-indigo-500 border-indigo-500'
                                                        : 'border-zinc-600 bg-transparent hover:border-zinc-500'
                                                )}
                                                aria-label={isSelected ? tCommon('deselectQuestion') : tCommon('selectQuestion')}
                                            >
                                                {isSelected && <Check size={10} className="text-white" />}
                                            </button>
                                        )}

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-xs font-bold px-1 rounded uppercase tracking-wider ${q.type === 'MULTI_CHOICE' ? 'text-cyan-400 bg-cyan-950/30' :
                                                            q.type === 'SNIPPET' ? 'text-pink-400 bg-pink-950/30' :
                                                                'text-amber-400 bg-amber-950/30'
                                                            }`}
                                                    >
                                                        {translatedType}
                                                    </Badge>
                                                </div>
                                                {!selectionMode && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteClick(q.id)}
                                                        className="h-6 w-6 lg:opacity-0 lg:group-hover:opacity-100 hover:bg-red-950/30 text-zinc-500 hover:text-red-400 transition-all opacity-100"
                                                        title={tCommon('delete')}
                                                        aria-label={tCommon('delete')}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="font-medium text-zinc-200 pr-6 mt-2">{q.data.question}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Floating Action Bar for Questions */}
                    {selectedIds.size > 0 && (
                        <div className="sticky bottom-0 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 mt-3 flex items-center gap-3">
                            <span className="text-xs text-zinc-300 font-medium">{tCommon('selected', { count: selectedIds.size })}</span>
                            <div className="h-3 w-px bg-zinc-700" />
                            <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs h-6 px-2">
                                {tCommon('all')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs h-6 px-2">
                                {tCommon('clear')}
                            </Button>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="text-xs h-6 px-2 ml-auto"
                            >
                                <Trash2 size={12} className="mr-1" />
                                {tCommon('delete')}
                            </Button>
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditClick}
                    disabled={!onOpenEditor || selectionMode}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                    <Edit2 className="w-3 h-3" />
                    {initialQuestions.length === 0 ? t('addQuestions') : t('editQuestions')}
                </Button>
            </div>
        </div>
    );
}

