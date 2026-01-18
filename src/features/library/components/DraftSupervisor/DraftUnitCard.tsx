import { Card } from '@/shared/ui/Card';
import { GripVertical, Trash2 } from 'lucide-react';
import { Reorder } from 'framer-motion';

export interface DraftUnit {
    title: string;
    type: 'TEXT' | 'CODE';
    description?: string;
}

interface DraftUnitCardProps {
    unit: DraftUnit;
    index: number;
    onUpdate: (index: number, field: keyof DraftUnit, value: string) => void;
    onDelete: (index: number) => void;
}

export function DraftUnitCard({ unit, index, onUpdate, onDelete }: DraftUnitCardProps) {
    return (
        <Reorder.Item
            value={unit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <Card className="group border-zinc-800 hover:border-zinc-700 transition-colors">
                <div className="p-4 flex gap-4">
                    <div className="pt-2 text-zinc-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-3">
                        {/* Unit Header Inputs */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <input
                                    className="w-full bg-transparent text-lg font-medium text-zinc-200 placeholder:text-zinc-600 focus:outline-none border-b border-transparent focus:border-indigo-500/50 transition-colors py-1"
                                    value={unit.title}
                                    onChange={(e) => onUpdate(index, 'title', e.target.value)}
                                    placeholder="Concept Title"
                                />
                            </div>
                            <select
                                value={unit.type}
                                onChange={(e) => onUpdate(index, 'type', e.target.value as 'TEXT' | 'CODE')}
                                className="bg-zinc-950 border border-zinc-800 rounded px-2 text-xs text-zinc-400 focus:outline-none h-8"
                            >
                                <option value="TEXT">TEXT</option>
                                <option value="CODE">CODE</option>
                            </select>
                        </div>

                        <textarea
                            className="w-full bg-zinc-900/30 text-sm text-zinc-300 placeholder:text-zinc-700 focus:outline-none border border-transparent focus:border-indigo-500/30 rounded p-2 transition-colors resize-none h-16 block"
                            value={unit.description || ''}
                            onChange={(e) => onUpdate(index, 'description', e.target.value)}
                            placeholder="Brief description of this concept (optional)"
                        />
                    </div>

                    {/* Action Column */}
                    <div className="pt-2">
                        <button
                            onClick={() => onDelete(index)}
                            className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-800"
                            aria-label="Delete unit"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </Card>
        </Reorder.Item >
    );
}
