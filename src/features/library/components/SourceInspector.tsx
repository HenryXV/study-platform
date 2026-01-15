'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { processContent } from '../actions/process-content';
import { deleteUnit } from '../actions/delete-unit';
import { UnitQuestionsList } from './UnitQuestionsList';
import { Trash2, GripVertical, ChevronLeft, AlertCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

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
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

    const toggleUnit = (unitId: string) => {
        const newSet = new Set(expandedUnits);
        if (newSet.has(unitId)) {
            newSet.delete(unitId);
        } else {
            newSet.add(unitId);
        }
        setExpandedUnits(newSet);
    };

    const handleDelete = (id: string) => {
        if (confirmingId === id) {
            // Confirmed execute
            startTransition(async () => {
                await deleteUnit(id);
                setConfirmingId(null);
                router.refresh();
            });
        } else {
            // First click
            setConfirmingId(id);
            setTimeout(() => setConfirmingId(null), 3000); // Reset after 3s
        }
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
            <div className="flex-1 min-h-0">
                <Group orientation="horizontal">

                    {/* Left Panel: Raw Source */}
                    <Panel defaultSize={50} minSize={20} className="flex flex-col">
                        <div className="h-10 border-b border-zinc-900 bg-zinc-900/40 flex items-center px-4 shrink-0 justify-between">
                            <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">Raw Source</span>
                            <span className="text-[10px] font-mono text-zinc-700">{source.bodyText.length} chars</span>
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-zinc-950">
                            <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed max-w-none">
                                {source.bodyText}
                            </pre>
                        </div>
                    </Panel>

                    <Separator className="w-1 bg-zinc-900 hover:bg-indigo-600 transition-colors flex items-center justify-center group active:bg-indigo-500">
                        <div className="h-8 w-1 bg-zinc-700 rounded-full group-hover:bg-white transition-colors" />
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

                                    <button
                                        onClick={handleProcess}
                                        disabled={isPending}
                                        className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg disabled:opacity-50 transition-all"
                                    >
                                        {isPending ? 'Processing...' : 'Analyze & Atomize'}
                                    </button>
                                    {result && !result.success && (
                                        <p className="mt-4 text-red-400 text-sm">{result.message}</p>
                                    )}
                                </div>
                            )}

                            {/* List View */}
                            {source.units && source.units.length > 0 && (
                                <div className="space-y-3">
                                    {source.units.map((unit) => (
                                        <div key={unit.id} className="group bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-all shadow-sm overflow-hidden">
                                            {/* Header / Main Content */}
                                            <div className="p-4 flex items-start justify-between gap-3 cursor-pointer" onClick={() => toggleUnit(unit.id)}>
                                                <div className="flex flex-col gap-2 overflow-hidden flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <button className="text-zinc-500 hover:text-zinc-300">
                                                            {expandedUnits.has(unit.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        </button>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${unit.type === 'CODE'
                                                            ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                                                            : 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                                                            }`}>
                                                            {unit.type}
                                                        </span>
                                                        <span className="text-xs text-zinc-600 font-mono select-none">ID: {unit.id.slice(-4)}</span>
                                                    </div>
                                                    <p className="text-sm text-zinc-200 font-medium leading-normal pl-6">
                                                        {unit.content}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(unit.id);
                                                    }}
                                                    disabled={isPending}
                                                    className={`p-1.5 rounded transition-all flex items-center gap-2 ${confirmingId === unit.id
                                                        ? 'opacity-100 bg-red-950/50 text-red-400 hover:bg-red-900/50'
                                                        : 'opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 hover:bg-zinc-800'
                                                        }`}
                                                    title={confirmingId === unit.id ? "Click to Confirm Deletion" : "Delete Unit"}
                                                >
                                                    {confirmingId === unit.id ? (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-1">Confirm?</span>
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            </div>

                                            {/* Expanded Questions Area */}
                                            {expandedUnits.has(unit.id) && (
                                                <div className="border-t border-zinc-900 bg-zinc-950/30 p-4 pt-2">
                                                    <UnitQuestionsList unitId={unit.id} questions={unit.questions || []} />
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Bottom Padding */}
                                    <div className="h-20" />
                                </div>
                            )}
                        </div>
                    </Panel>
                </Group>
            </div>
        </div>
    );
}
