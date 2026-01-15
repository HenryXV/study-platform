import { DailyMetric } from "../actions/get-metrics";

interface ActivityHeatmapProps {
    data: DailyMetric[];
    streak: number;
}

export function ActivityHeatmap({ data, streak }: ActivityHeatmapProps) {
    return (
        <div className="w-full max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Streak Counter */}
                <div className="flex flex-col items-center md:items-start">
                    <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">Current Streak</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100">{streak}</span>
                        <span className="text-sm text-zinc-400 font-medium">days</span>
                    </div>
                </div>

                {/* Vertical Divider (Hidden on Mobile) */}
                <div className="hidden md:block w-px h-12 bg-zinc-800"></div>

                {/* Heatmap Grid */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                    <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider text-center md:text-left">Last 7 Days</span>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        {data.map((day) => (
                            <div key={day.date} className="flex flex-col items-center gap-2 group cursor-default">
                                <div
                                    className={`w-10 h-10 rounded-md border transition-all duration-300 relative ${day.count > 0
                                            ? 'bg-emerald-500/20 border-emerald-500/40 shadow shadow-emerald-900/20 group-hover:scale-105'
                                            : 'bg-zinc-800/50 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                    title={`${day.count} items on ${day.label}`}
                                >
                                    {day.count > 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] font-mono ${day.count > 0 ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                    {day.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
