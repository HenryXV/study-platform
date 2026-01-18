'use client';

import { useState, useCallback } from 'react';
import { Trash2, ChevronDown, ChevronRight, Sparkles, Loader2, Edit2, Save, Check, X, CheckSquare } from 'lucide-react';
import { updateStudyUnit } from '../actions/update-study-unit';
import { deleteUnitsBulk } from '../actions/delete-units-bulk';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { UnitQuestionsList } from './UnitQuestionsList';
import { EditableQuestion } from '../schemas/question-generator';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface StudyUnit {
    id: string;
    type: 'TEXT' | 'CODE';
    content: string; // Title/Concept Name
    description: string | null;
    questions: { id: string; type: string; data: import('@/features/study-session/data/flash-cards').QuestionData }[];
}

interface GeneratedUnitsListProps {
    units: StudyUnit[];
    expandedUnits: Set<string>;
    onToggle: (unitId: string) => void;
    onDelete: (unitId: string) => Promise<void>;
    onOpenSupervisor?: (unitId: string, unitContent: string, unitType: 'TEXT' | 'CODE') => void;
    onOpenEditor?: (unitId: string, questions: EditableQuestion[]) => void;
}

export function GeneratedUnitsList({ units, expandedUnits, onToggle, onDelete, onOpenSupervisor, onOpenEditor }: GeneratedUnitsListProps) {
    const router = useRouter();

    // Single delete state
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Bulk selection state
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Generation State
    const [isGeneratingId, setIsGeneratingId] = useState<string | null>(null);

    // Editing State
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ content: string; description: string }>({ content: '', description: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Selection helpers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(units.map(u => u.id)));
    const clearSelection = () => setSelectedIds(new Set());

    const exitSelectionMode = () => {
        setSelectionMode(false);
        clearSelection();
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsBulkDeleting(true);
        const toastId = toast.loading(`Deleting ${selectedIds.size} units...`);

        try {
            const result = await deleteUnitsBulk(Array.from(selectedIds));
            if (result.success) {
                toast.success(result.message || `Deleted ${result.count} units`, { id: toastId });
                exitSelectionMode();
                router.refresh();
            } else {
                toast.error(result.message || "Failed to delete", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred", { id: toastId });
        } finally {
            setIsBulkDeleting(false);
            setShowBulkDeleteModal(false);
        }
    };

    // Single delete handlers
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
        if (onOpenSupervisor) {
            setIsGeneratingId(unit.id);
            await onOpenSupervisor(unit.id, unit.content, unit.type);
            setIsGeneratingId(null);
        }
    };

    // Prevent propagation when clicking actions
    const handleActionClick = useCallback((e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
    }, []);

    const handleEditClick = (unit: StudyUnit) => {
        setEditingUnitId(unit.id);
        setEditForm({ content: unit.content, description: unit.description || '' });
    };

    const handleCancelEdit = () => {
        setEditingUnitId(null);
        setEditForm({ content: '', description: '' });
    };

    const handleSaveEdit = async () => {
        if (!editingUnitId) return;
        setIsSaving(true);
        const toastId = toast.loading("Updating unit...");

        try {
            const result = await updateStudyUnit(editingUnitId, editForm.content, editForm.description);
            if (result.success) {
                toast.success("Unit updated successfully", { id: toastId });
                setEditingUnitId(null);
            } else {
                toast.error(result.message || "Failed to update unit", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred while updating", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (units.length === 0) {
        return <p className="text-sm text-zinc-500 italic p-4">No units found.</p>;
    }

    return (
        <>
            {/* Single Delete Modal */}
            <ConfirmModal
                isOpen={!!deletingId}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete Unit"
                message="Are you sure you want to delete this unit? All associated questions will also be removed."
                confirmText="Delete Unit"
                isLoading={isDeleting}
            />

            {/* Bulk Delete Modal */}
            <ConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={() => setShowBulkDeleteModal(false)}
                onConfirm={handleBulkDelete}
                title="Delete Selected Units"
                message={`Are you sure you want to delete ${selectedIds.size} units? All associated questions will also be removed.`}
                confirmText={`Delete ${selectedIds.size} Units`}
                isLoading={isBulkDeleting}
            />

            {/* Header Toolbar */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-zinc-400">{units.length} units</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (selectionMode) {
                            exitSelectionMode();
                        } else {
                            setSelectionMode(true);
                            // Auto-select first item
                            if (units.length > 0) {
                                setSelectedIds(new Set([units[0].id]));
                            }
                        }
                    }}
                    className={cn(
                        "text-xs gap-1.5",
                        selectionMode
                            ? "text-zinc-400"
                            : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/30"
                    )}
                >
                    {selectionMode ? (
                        <>
                            <X size={14} />
                            Cancel
                        </>
                    ) : (
                        <>
                            <CheckSquare size={14} />
                            Select Multiple
                        </>
                    )}
                </Button>
            </div>

            <div className="space-y-3 pb-20">
                {units.map((unit) => {
                    const isExpanded = expandedUnits.has(unit.id);
                    const isGenerating = isGeneratingId === unit.id;
                    const isSelected = selectedIds.has(unit.id);

                    return (
                        <Card key={unit.id} className={cn(
                            "group hover:border-zinc-700 transition-all shadow-sm overflow-hidden",
                            isSelected && "border-indigo-500/50 bg-indigo-950/10"
                        )}>
                            {/* Header / Main Content */}
                            <div className="flex items-start justify-between p-4 gap-3">
                                {/* Selection Checkbox */}
                                {selectionMode && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(unit.id); }}
                                        className={cn(
                                            'h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                                            isSelected
                                                ? 'bg-indigo-500 border-indigo-500'
                                                : 'border-zinc-600 bg-transparent hover:border-zinc-500'
                                        )}
                                        aria-label={isSelected ? "Deselect unit" : "Select unit"}
                                    >
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </button>
                                )}

                                {/* Main Expand Toggle */}
                                <button
                                    onClick={() => !selectionMode && onToggle(unit.id)}
                                    disabled={selectionMode}
                                    className={cn(
                                        "flex flex-col gap-2 overflow-hidden flex-1 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/50 rounded-lg -m-2 p-2 transition-colors",
                                        !selectionMode && "hover:bg-zinc-900/40"
                                    )}
                                    aria-expanded={isExpanded}
                                >
                                    <div className="flex items-center gap-2">
                                        {!selectionMode && (
                                            <div className="h-5 w-5 flex items-center justify-center text-zinc-500">
                                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </div>
                                        )}
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

                                    {editingUnitId === unit.id ? (
                                        <div className="pl-8 w-full max-w-2xl space-y-2 cursor-default" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                value={editForm.content}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                                                placeholder="Unit Title / Concept"
                                                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <textarea
                                                value={editForm.description}
                                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="Description (optional)"
                                                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-200 h-20 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                                                <Button size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                                                    {isSaving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={selectionMode ? "" : "pl-8"}>
                                            <p className="text-sm text-zinc-200 font-medium leading-normal">
                                                {unit.content}
                                            </p>
                                            {unit.description && (
                                                <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                                                    {unit.description}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </button>

                                {/* Actions (hidden in selection mode) */}
                                {!selectionMode && (
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
                                            onClick={(e) => handleActionClick(e, () => handleEditClick(unit))}
                                            className="h-7 w-7 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-950/20"
                                            title="Edit Unit"
                                            disabled={editingUnitId === unit.id}
                                        >
                                            <Edit2 size={14} />
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
                                )}
                            </div>

                            {/* Expanded Questions Area */}
                            {isExpanded && !selectionMode && (
                                <div className="border-t border-zinc-800 bg-zinc-950/30 p-4 pt-2">
                                    <UnitQuestionsList
                                        unitId={unit.id}
                                        questions={unit.questions || []}
                                        onOpenEditor={onOpenEditor}
                                    />
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>

            {/* Floating Action Bar (when items selected) */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl flex items-center gap-4 z-50">
                    <span className="text-sm text-zinc-300 font-medium">{selectedIds.size} selected</span>
                    <div className="h-4 w-px bg-zinc-700" />
                    <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                        Select All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs">
                        Clear
                    </Button>
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowBulkDeleteModal(true)}
                        className="text-xs"
                    >
                        <Trash2 size={14} className="mr-1.5" />
                        Delete Selected
                    </Button>
                </div>
            )}
        </>
    );
}

