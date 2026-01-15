
import { Trash2 } from 'lucide-react';

interface StudyUnit {
    id: string;
    type: 'TEXT' | 'CODE';
    content: string; // Title/Concept Name
}

interface GeneratedUnitsListProps {
    units: StudyUnit[];
}

export function GeneratedUnitsList({ units }: GeneratedUnitsListProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-100">Generated Units</h3>
                <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded-full">
                    {units.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 min-h-0 custom-scrollbar pr-2">
                {units.length === 0 ? (
                    <p className="text-sm text-zinc-500 italic">No units found.</p>
                ) : (
                    units.map((unit) => (
                        <div
                            key={unit.id}
                            className="group p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors flex items-start justify-between gap-3 shrink-0"
                        >
                            <div className="flex flex-col gap-1.5 overflow-hidden">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${unit.type === 'CODE'
                                        ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40'
                                        : 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                                        }`}>
                                        {unit.type}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-300 font-medium leading-snug break-words" title={unit.content}>
                                    {unit.content}
                                </p>
                            </div>

                            <button
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-all"
                                title="Delete Unit"
                                aria-label="Delete Unit"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
