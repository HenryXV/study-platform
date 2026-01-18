'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { analyzeContentPreview } from '../actions/analyze-content';
import { commitContent } from '../actions/commit-content';
import { deleteUnit } from '../actions/delete-unit';
import { retryEmbeddings } from '../actions/retry-embeddings';
import { GeneratedUnitsList } from './GeneratedUnitsList';
import { DraftSupervisor, ApprovedDraftData } from './DraftSupervisor';
import { QuestionSupervisor } from './QuestionSupervisor';
import { ProcessingOptionsModal } from './ProcessingOptionsModal';
import { QuestionOptionsModal } from './QuestionOptionsModal';
import { Button } from '@/shared/ui/Button';
import { PdfViewer } from '@/shared/ui/PdfViewer';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { generateQuestionsPreview } from '../actions/generate-questions-preview';
import { commitQuestions } from '../actions/commit-questions';
import { updateQuestions } from '../actions/update-questions';
import { Question, EditableQuestion } from '../schemas/question-generator';
import { ProcessingOptions } from '../schemas/processing-options';
import { QuestionGenerationOptions } from '../schemas/question-options';

interface SourceInspectorProps {
    source: {
        id: string;
        title: string;
        bodyText: string;
        fileUrl?: string | null;
        status: 'UNPROCESSED' | 'PROCESSED';
        units?: Array<{
            id: string;
            type: 'TEXT' | 'CODE';
            content: string;
            description: string | null;
            questions: { id: string; type: string; data: import('@/features/study-session/data/flash-cards').QuestionData }[];
        }>;
        _count?: { chunks: number };
    };
}

export function SourceInspector({ source }: SourceInspectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Processing Options Modal State
    const [showOptionsModal, setShowOptionsModal] = useState(false);

    // Workflow State
    const [draftData, setDraftData] = useState<ApprovedDraftData | null>(null);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

    // Simple responsive check (could be moved to a hook)
    const [isMobile, setIsMobile] = useState(false);

    // View mode toggle (PDF vs Raw Text)
    const [viewMode, setViewMode] = useState<'pdf' | 'raw'>('pdf');

    // Question Supervisor State (lifted from GeneratedUnitsList)
    // For generating new questions
    const [questionDraft, setQuestionDraft] = useState<{ unitId: string; questions: Question[] } | null>(null);
    // For editing existing questions
    const [questionEdit, setQuestionEdit] = useState<{ unitId: string; questions: EditableQuestion[] } | null>(null);

    // Question Options Modal State
    const [questionOptionsTarget, setQuestionOptionsTarget] = useState<{ unitId: string; content: string; type: 'TEXT' | 'CODE' } | null>(null);
    const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

    // Hydration-safe resize observer
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024); // lg breakpoint
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleUnit = (unitId: string) => {
        const newSet = new Set(expandedUnits);
        if (newSet.has(unitId)) {
            newSet.delete(unitId);
        } else {
            newSet.add(unitId);
        }
        setExpandedUnits(newSet);
    };

    const handleDelete = async (id: string) => {
        await deleteUnit(id);
        router.refresh();
    };

    // Step 1: Analyze (Preview) - Now accepts ProcessingOptions from modal
    const handleAnalyze = async (options: ProcessingOptions) => {
        setShowOptionsModal(false);
        setIsAnalyzing(true);
        try {
            const res = await analyzeContentPreview(source.id, options);
            if (res.success && res.data) {
                // Transform the raw AI output into the Draft structure (checking types)
                // The AI SDK output is already validated by Zod in the action, 
                // but we cast it here for TS convenience in the UI component
                const raw = res.data;

                // Map to ensure it fits DraftUnit interface if strictly needed, 
                // though it matches the Zod schema 1:1 currently.
                const draft: ApprovedDraftData = {
                    suggestedSubject: raw.suggestedSubject,
                    suggestedTopics: raw.suggestedTopics,
                    units: raw.units.map((u: any) => ({
                        title: u.title,
                        description: u.description,
                        type: u.type as 'TEXT' | 'CODE',
                    }))
                };
                setDraftData(draft);
            } else {
                toast.error(res.message || "Analysis failed");
                console.error("Analysis failed");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred during analysis");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Step 2: Commit (Save)
    const handleCommit = async (data: ApprovedDraftData) => {
        const res = await commitContent(source.id, data);

        if (res.success) {
            startTransition(() => {
                setDraftData(null); // Clear draft mode
                router.refresh();   // Show real data
            });

            if (res.embeddingFailed) {
                toast.warning("Content saved, but embeddings failed. Please retry.");
            } else {
                toast.success("Content saved and processed!");
            }
        } else {
            toast.error(res.message || "Failed to commit");
        }
    };

    const handleRetryEmbeddings = () => {
        startTransition(async () => {
            const res = await retryEmbeddings(source.id);
            if (res.success) {
                toast.success("Embeddings generated successfully!");
                router.refresh();
            } else {
                toast.error(res.message || "Retry failed");
            }
        });
    };

    // Question Generation - Opens options modal instead of immediate generation
    const handleOpenSupervisor = (unitId: string, unitContent: string, unitType: 'TEXT' | 'CODE') => {
        setQuestionOptionsTarget({ unitId, content: unitContent, type: unitType });
    };

    // Called when user confirms options in modal
    const handleGenerateWithOptions = async (options: QuestionGenerationOptions) => {
        if (!questionOptionsTarget) return;
        setIsGeneratingQuestions(true);
        try {
            const result = await generateQuestionsPreview(
                questionOptionsTarget.unitId,
                questionOptionsTarget.content,
                questionOptionsTarget.type,
                options
            );
            if (result.success && result.questions) {
                setQuestionOptionsTarget(null); // Close modal only on success
                setQuestionDraft({ unitId: questionOptionsTarget.unitId, questions: result.questions });
            } else {
                toast.error(result.message || "Failed to generate questions");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setIsGeneratingQuestions(false);
        }
    };

    const handleQuestionCommit = async (finalQuestions: Question[], deletedIds: string[]) => {
        if (!questionDraft) return;
        const toastId = toast.loading("Saving questions...");
        try {
            const result = await commitQuestions(questionDraft.unitId, finalQuestions);
            if (result.success) {
                toast.success(`Added ${result.count} questions to library`, { id: toastId });
                setQuestionDraft(null);
                router.refresh();
            } else {
                toast.error(result.message || "Failed to save questions", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to commit questions", { id: toastId });
        }
    };

    // Edit existing questions (lifted from UnitQuestionsList)
    const handleOpenEditor = (unitId: string, questions: EditableQuestion[]) => {
        setQuestionEdit({ unitId, questions });
    };

    const handleEditCommit = async (finalQuestions: EditableQuestion[], deletedIds: string[]) => {
        const toastId = toast.loading("Updating questions...");
        try {
            if (!questionEdit?.unitId) {
                toast.error("Missing unit context");
                return;
            }
            const result = await updateQuestions(questionEdit.unitId, finalQuestions, deletedIds);
            if (result.success) {
                toast.success("Questions updated successfully", { id: toastId });
                setQuestionEdit(null);
                router.refresh();
            } else {
                toast.error(result.message || "Failed to update questions", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to update questions", { id: toastId });
        }
    };

    // Note: The parent container MUST manage the height (e.g., flex-1)
    return (
        <div className="flex-1 w-full flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden min-h-0">
            {/* Split Sreen Panels */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Group orientation={isMobile ? 'vertical' : 'horizontal'}>

                    {/* Left Panel: Source View */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-900">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0 justify-between">
                            {source.fileUrl ? (
                                <div className="relative">
                                    <select
                                        value={viewMode}
                                        onChange={(e) => setViewMode(e.target.value as 'pdf' | 'raw')}
                                        className="appearance-none bg-transparent text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider cursor-pointer pr-5 hover:text-zinc-200 transition-colors focus:outline-none"
                                    >
                                        <option value="pdf" className="bg-zinc-900">PDF Document</option>
                                        <option value="raw" className="bg-zinc-900">Raw Text</option>
                                    </select>
                                    <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
                                </div>
                            ) : (
                                <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">
                                    Raw Source
                                </span>
                            )}
                            <span className="text-xs font-mono text-zinc-500">{source.bodyText.length} chars</span>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950 min-h-0">
                            {source.fileUrl && viewMode === 'pdf' ? (
                                <PdfViewer url={source.fileUrl} title={source.title} />
                            ) : (
                                <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-none p-6">
                                    {source.bodyText}
                                </pre>
                            )}
                        </div>
                    </Panel>

                    <Separator className="w-px bg-zinc-900 hover:bg-indigo-600 transition-colors flex items-center justify-center group active:bg-indigo-500 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full focus-visible:bg-indigo-500 outline-none">
                        <div className="h-8 w-1 data-[orientation=vertical]:h-1 data-[orientation=vertical]:w-8 bg-zinc-800 rounded-full group-hover:bg-white transition-colors group-active:bg-white group-focus-visible:bg-white" />
                    </Separator>

                    {/* Right Panel: Extraction/Supervisor View */}
                    <Panel defaultSize={75} minSize={20} className="flex flex-col">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0">
                            <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">
                                {questionDraft || questionEdit ? 'Exam Workbench' : draftData ? 'Supervisor Mode' : 'Atomic Units'}
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950/50 relative">

                            {/* State 0a: Question Supervisor - Generate Mode (Inline) */}
                            {questionDraft ? (
                                <QuestionSupervisor
                                    initialQuestions={questionDraft.questions}
                                    onCancel={() => setQuestionDraft(null)}
                                    onCommit={handleQuestionCommit}
                                    inline
                                />
                            ) : questionEdit ? (
                                /* State 0b: Question Supervisor - Edit Mode (Inline) */
                                <QuestionSupervisor
                                    initialQuestions={questionEdit.questions}
                                    onCancel={() => setQuestionEdit(null)}
                                    onCommit={handleEditCommit}
                                    inline
                                />
                            ) : draftData ? (
                                /* State 1: Draft Supervisor (Reviewing AI Output) */
                                <div className="p-6">
                                    <DraftSupervisor
                                        initialData={draftData}
                                        onCancel={() => setDraftData(null)}
                                        onCommit={handleCommit}
                                    />
                                </div>
                            ) : (
                                <>
                                    {/* State 2: Empty / Unprocessed */}
                                    {(!source.units || source.units.length === 0) && (
                                        <div className="max-w-md mx-auto mt-20 p-6 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center">
                                            <h3 className="text-lg font-medium text-zinc-100 mb-2">No Units Extracted</h3>
                                            <p className="text-sm text-zinc-400 mb-6">
                                                Process this content to generate study flashcards and code snippets.
                                            </p>

                                            <Button
                                                onClick={() => setShowOptionsModal(true)}
                                                disabled={isAnalyzing}
                                                className="w-full"
                                                isLoading={isAnalyzing}
                                            >
                                                Analyze & Atomize
                                            </Button>

                                            {/* Processing Options Modal */}
                                            <ProcessingOptionsModal
                                                isOpen={showOptionsModal}
                                                onClose={() => setShowOptionsModal(false)}
                                                onConfirm={handleAnalyze}
                                                isLoading={isAnalyzing}
                                            />
                                        </div>
                                    )}

                                    {/* State 3: View Processed Units OR Retry Embeddings */}
                                    {source.units && source.units.length > 0 && (
                                        <>
                                            {(!source._count || source._count.chunks === 0) ? (
                                                <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-xl border border-amber-900/50 text-center m-6">
                                                    <div className="h-12 w-12 rounded-full bg-amber-900/20 flex items-center justify-center mb-4 text-amber-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                                    </div>
                                                    <h3 className="text-zinc-100 font-medium mb-2">Embeddings Missing</h3>
                                                    <p className="text-zinc-400 text-sm mb-6 max-w-xs">
                                                        The content was saved, but the AI embeddings failed to generate. This affects search and RAG features.
                                                    </p>
                                                    <Button
                                                        onClick={handleRetryEmbeddings}
                                                        isLoading={isPending}
                                                        className="w-full max-w-xs bg-amber-600 hover:bg-amber-700 text-white border-amber-500"
                                                    >
                                                        Retry Processing
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="p-6">
                                                    <GeneratedUnitsList
                                                        units={source.units}
                                                        expandedUnits={expandedUnits}
                                                        onToggle={toggleUnit}
                                                        onDelete={handleDelete}
                                                        onOpenSupervisor={handleOpenSupervisor}
                                                        onOpenEditor={handleOpenEditor}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </Panel>
                </Group>
            </div>

            {/* Question Options Modal */}
            <QuestionOptionsModal
                isOpen={!!questionOptionsTarget}
                onClose={() => setQuestionOptionsTarget(null)}
                onConfirm={handleGenerateWithOptions}
                isLoading={isGeneratingQuestions}
            />
        </div>
    );
}
