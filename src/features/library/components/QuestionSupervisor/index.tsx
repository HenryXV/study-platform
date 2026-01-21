'use client';

import { useState } from 'react';
import { Trash2, Plus, Save, X, ChevronRight, Layout, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';
import { Question, EditableQuestion, QuestionSchema } from '@/features/library/schemas/question-generator';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { QuestionEditor } from './QuestionEditor';

interface QuestionSupervisorProps {
    initialQuestions: EditableQuestion[];
    onCancel: () => void;
    onCommit: (questions: EditableQuestion[], deletedIds: string[]) => void;
    inline?: boolean;
}

export function QuestionSupervisor({ initialQuestions, onCancel, onCommit, inline = false }: QuestionSupervisorProps) {
    const t = useTranslations('library.supervisor');
    const common = useTranslations('common');
    const editorT = useTranslations('library.editor');
    const [questions, setQuestions] = useState<EditableQuestion[]>(initialQuestions);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
    const [deletedIds, setDeletedIds] = useState<string[]>([]);
    const [showMobileEditor, setShowMobileEditor] = useState(false);

    const handleUpdate = (updated: EditableQuestion) => {
        const newQuestions = [...questions];
        newQuestions[selectedIndex] = updated;
        setQuestions(newQuestions);

        // Clear error for this index on update
        if (errors[selectedIndex]) {
            const newErrors = { ...errors };
            delete newErrors[selectedIndex];
            setErrors(newErrors);
        }
    };

    const handleDelete = (index: number) => {
        const questionToDelete = questions[index];
        if (questionToDelete.id) {
            setDeletedIds([...deletedIds, questionToDelete.id]);
        }
        const newQuestions = questions.filter((_, i) => i !== index);
        setQuestions(newQuestions);

        // Shift errors? Simpler to just clear errors on delete to avoid index mismatch
        setErrors({});

        if (selectedIndex >= newQuestions.length) {
            setSelectedIndex(Math.max(0, newQuestions.length - 1));
        }
    };

    const handleAdd = () => {
        const newQ: Question = {
            questionText: editorT('newQuestion'),
            type: 'OPEN',
            correctAnswer: '',
            explanation: '',
            options: [],
            topics: [],
        };
        setQuestions([...questions, newQ]);
        setSelectedIndex(questions.length);
        setShowMobileEditor(true);
    };

    const validateAndCommit = () => {
        const newErrors: Record<number, Record<string, string>> = {};
        let firstInvalidIndex = -1;

        questions.forEach((q, idx) => {
            const result = QuestionSchema.safeParse(q);
            if (!result.success) {
                const fieldErrors: Record<string, string> = {};
                result.error.issues.forEach(e => {
                    const field = e.path[0] as string;
                    fieldErrors[field] = e.message;
                });
                newErrors[idx] = fieldErrors;
                if (firstInvalidIndex === -1) firstInvalidIndex = idx;
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            if (firstInvalidIndex !== -1) {
                setSelectedIndex(firstInvalidIndex);
                toast.error(t('validationError', { index: firstInvalidIndex + 1 }));
            }
            return;
        }

        onCommit(questions, deletedIds);
    };

    const selectedQuestion = questions[selectedIndex];
    const selectedErrors = errors[selectedIndex];

    const content = (
        <div className={`flex flex-col ${inline ? 'h-full' : 'w-full max-w-7xl h-full max-h-[90vh]'} bg-zinc-950 border-zinc-800 overflow-hidden ${!inline ? 'shadow-2xl animate-in fade-in zoom-in-95 duration-200 rounded-lg border' : ''}`}>
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    {/* Back Button for Mobile Editor */}
                    <div className={`md:hidden ${showMobileEditor ? 'flex' : 'hidden'} mr-1`}>
                        <Button variant="ghost" size="sm" onClick={() => setShowMobileEditor(false)} className="gap-1 group px-2 -ml-2">
                            <ChevronRight size={18} className="rotate-180 text-zinc-500 group-hover:text-zinc-300" />
                            <span className="text-zinc-500 group-hover:text-zinc-300 font-medium">Back</span>
                        </Button>
                    </div>

                    <div className="h-8 w-8 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <Layout size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                            {t('title')}
                        </h2>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-wide">
                            {questions.length} {common('questions')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel}>
                        {common('cancel')}
                    </Button>
                    <Button onClick={validateAndCommit} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20">
                        <Save size={16} className="mr-2" />
                        {t('finalize')}
                    </Button>
                </div>
            </div>

            {/* Workbench Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: List */}
                <div className={`${showMobileEditor ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-zinc-800 bg-zinc-900/20 flex-col`}>
                    <div className="p-3 border-b border-zinc-800/50 flex justify-between items-center">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('questions')}</span>
                        <Button size="sm" variant="ghost" onClick={handleAdd} className="hover:bg-zinc-800 hover:text-indigo-400 gap-2 h-8 px-2 md:h-6 md:w-6 md:px-0">
                            <Plus size={14} />
                            <span className="md:hidden">Add</span>
                        </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {questions.map((q, idx) => {
                            const hasError = !!errors[idx];
                            return (
                                <div
                                    key={idx}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        setSelectedIndex(idx);
                                        setShowMobileEditor(true);
                                    }}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedIndex(idx); setShowMobileEditor(true); } }}
                                    className={`group flex items-center justify-between p-3 rounded-md text-sm border cursor-pointer transition-all ${idx === selectedIndex
                                        ? 'bg-zinc-800 border-zinc-700 text-zinc-100 shadow-sm'
                                        : 'border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                        } ${hasError ? 'border-red-900/50 bg-red-950/10' : ''}`}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className={`text-xs font-mono ${idx === selectedIndex ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <div className="flex flex-col truncate">
                                            <div className="flex items-center gap-2">
                                                <span className="truncate font-medium">{q.questionText || t('emptyQuestion')}</span>
                                                {hasError && <AlertCircle size={12} className="text-red-500 shrink-0" />}
                                            </div>
                                            <span className="text-xs uppercase opacity-70">
                                                {editorT(`types.${q.type}`)}
                                            </span>
                                        </div>
                                    </div>
                                    {idx === selectedIndex && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={(e) => { e.stopPropagation(); handleDelete(idx); }}
                                            className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-950/20"
                                        >
                                            <Trash2 size={12} />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className={`${showMobileEditor ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-zinc-950 overflow-hidden relative`}>
                    {selectedQuestion ? (
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto space-y-6">
                                <QuestionEditor
                                    question={selectedQuestion}
                                    onUpdate={handleUpdate}
                                    errors={selectedErrors}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-zinc-600 flex-col gap-4">
                            <div className="flex flex-col items-center gap-2">
                                <AlertCircle size={48} className="opacity-10 text-zinc-500" />
                                <p className="text-zinc-500 font-medium">
                                    {questions.length === 0 ? t('noQuestions') : t('noSelection')}
                                </p>
                            </div>

                            {questions.length === 0 && (
                                <Button
                                    onClick={handleAdd}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                                >
                                    <Plus size={16} className="mr-2" />
                                    {t('createFirst')}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (inline) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8">
            {content}
        </div>
    );
}

