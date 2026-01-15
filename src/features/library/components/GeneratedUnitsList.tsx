import { useState, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { UnitQuestionsList } from './UnitQuestionsList';

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

            <div className="space-y-3 pb-20">
                {units.map((unit) => {
                    const isExpanded = expandedUnits.has(unit.id);
                    return (
                        <Card key={unit.id} className="group hover:border-zinc-700 transition-all shadow-sm overflow-hidden">
                            {/* Header / Main Content */}
                            <div
                                className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                                onClick={() => onToggle(unit.id)}
                            >
                                <div className="flex flex-col gap-2 overflow-hidden flex-1">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 hover:text-zinc-300 text-zinc-500"
                                        >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </Button>
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
                                </div>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => handleActionClick(e, () => handleDeleteInit(unit.id))}
                                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all"
                                    title="Delete Unit"
                                >
                                    <Trash2 size={14} />
                                </Button>
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
