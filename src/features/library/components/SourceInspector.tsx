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
import { Button } from '@/shared/ui/Button';
import { toast } from 'sonner';

interface SourceInspectorProps {
    source: {
        id: string;
        title: string;
        bodyText: string;
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

    // Workflow State
    const [draftData, setDraftData] = useState<ApprovedDraftData | null>(null);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

    // Simple responsive check (could be moved to a hook)
    const [isMobile, setIsMobile] = useState(false);

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

    // Step 1: Analyze (Preview)
    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await analyzeContentPreview(source.id);
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

    // Note: The parent container MUST manage the height (e.g., flex-1)
    return (
        <div className="flex-1 w-full flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden min-h-0">
            {/* Split Sreen Panels */}
            <div className="flex-1 min-h-0 flex flex-col">
                <Group orientation={isMobile ? 'vertical' : 'horizontal'}>

                    {/* Left Panel: Raw Source */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-900">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0 justify-between">
                            <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">Raw Source</span>
                            <span className="text-xs font-mono text-zinc-500">{source.bodyText.length} chars</span>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-zinc-950">
                            <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-none">
                                {source.bodyText}
                            </pre>
                        </div>
                    </Panel>

                    <Separator className="w-px bg-zinc-900 hover:bg-indigo-600 transition-colors flex items-center justify-center group active:bg-indigo-500 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full focus-visible:bg-indigo-500 outline-none">
                        <div className="h-8 w-1 data-[orientation=vertical]:h-1 data-[orientation=vertical]:w-8 bg-zinc-800 rounded-full group-hover:bg-white transition-colors group-active:bg-white group-focus-visible:bg-white" />
                    </Separator>

                    {/* Right Panel: Extraction/Supervisor View */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0">
                            <span className="text-xs font-mono text-zinc-500 font-bold uppercase tracking-wider">
                                {draftData ? 'Supervisor Mode' : 'Atomic Units'}
                            </span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950/50 p-6 relative">

                            {/* State 1: Draft Supervisor (Reviewing AI Output) */}
                            {draftData ? (
                                <DraftSupervisor
                                    initialData={draftData}
                                    onCancel={() => setDraftData(null)}
                                    onCommit={handleCommit}
                                />
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
                                                onClick={handleAnalyze}
                                                disabled={isAnalyzing}
                                                className="w-full"
                                                isLoading={isAnalyzing}
                                            >
                                                Analyze & Atomize
                                            </Button>
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
                                                <GeneratedUnitsList
                                                    units={source.units}
                                                    expandedUnits={expandedUnits}
                                                    onToggle={toggleUnit}
                                                    onDelete={handleDelete}
                                                />
                                            )}
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </Panel>
                </Group>
            </div>
        </div>
    );
}
