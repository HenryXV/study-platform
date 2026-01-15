'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { processContent } from '../actions/process-content';
import { deleteUnit } from '../actions/delete-unit';
import { GeneratedUnitsList } from './GeneratedUnitsList';
import { Button } from '@/shared/ui/Button';

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
            questions: { id: string; type: string; data: import('@/features/study-session/data/flash-cards').QuestionData }[];
        }>;
    };
}

export function SourceInspector({ source }: SourceInspectorProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ success: boolean; message?: string; count?: number } | null>(null);
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

    const handleProcess = () => {
        setResult(null);
        startTransition(async () => {
            const res = await processContent(source.id);
            if (res.success) {
                setResult({ success: true, count: res.count });
                router.refresh();
            } else {
                setResult({ success: false, message: res.message });
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
                            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Raw Source</span>
                            <span className="text-[10px] font-mono text-zinc-500">{source.bodyText.length} chars</span>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-zinc-950">
                            <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-none">
                                {source.bodyText}
                            </pre>
                        </div>
                    </Panel>

                    <Separator className="w-px bg-zinc-900 hover:bg-indigo-600 transition-colors flex items-center justify-center group active:bg-indigo-500 data-[orientation=vertical]:h-px data-[orientation=vertical]:w-full">
                        <div className="h-8 w-1 data-[orientation=vertical]:h-1 data-[orientation=vertical]:w-8 bg-zinc-800 rounded-full group-hover:bg-white transition-colors" />
                    </Separator>

                    {/* Right Panel: Extraction View */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Atomic Units</span>
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar bg-zinc-950/50 p-6 relative">
                            {/* Empty / Processor State */}
                            {(!source.units || source.units.length === 0) && (
                                <div className="max-w-md mx-auto mt-20 p-6 border border-zinc-800 rounded-xl bg-zinc-900/50 text-center">
                                    <h3 className="text-lg font-medium text-zinc-100 mb-2">No Units Extracted</h3>
                                    <p className="text-sm text-zinc-400 mb-6">
                                        Process this content to generate study flashcards and code snippets.
                                    </p>

                                    <Button
                                        onClick={handleProcess}
                                        disabled={isPending}
                                        className="w-full"
                                        isLoading={isPending}
                                    >
                                        Analyze & Atomize
                                    </Button>
                                    {result && !result.success && (
                                        <p className="mt-4 text-red-400 text-sm">{result.message}</p>
                                    )}
                                </div>
                            )}

                            {/* List View */}
                            {source.units && source.units.length > 0 && (
                                <GeneratedUnitsList
                                    units={source.units}
                                    expandedUnits={expandedUnits}
                                    onToggle={toggleUnit}
                                    onDelete={handleDelete}
                                />
                            )}
                        </div>
                    </Panel>
                </Group>
            </div>
        </div>
    );
}
