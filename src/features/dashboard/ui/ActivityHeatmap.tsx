import { DailyMetric } from "../actions/get-metrics";
import { getTranslations } from 'next-intl/server';

interface ActivityHeatmapProps {
    data: DailyMetric[];
    streak: number;
}

export async function ActivityHeatmap({ data, streak }: ActivityHeatmapProps) {
    const t = await getTranslations('dashboard');

    return (
        <div className="w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-full flex flex-col md:flex-row lg:flex-col items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-50"></div>

                {/* Streak Counter */}
                <div className="flex flex-col items-center md:items-start lg:items-center z-10">
                    <span className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">{t('weeklyConsistency')}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-zinc-100">{streak}</span>
                        <span className="text-sm text-zinc-400 font-medium">{t('dayStreak')}</span>
                    </div>
                </div>

                {/* Vertical Divider (Hidden on Mobile/Desktop Side-Panel) */}
                <div className="hidden md:block lg:hidden w-px h-12 bg-zinc-800"></div>

                {/* Heatmap Grid */}
                <div className="flex flex-col gap-2 w-full md:w-auto lg:w-full z-10">
                    <span className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider text-center md:text-left lg:text-center">{t('last21Days')}</span>
                    <div className="grid grid-cols-21 gap-1 lg:gap-1.5 xl:gap-2">
                        {data.map((day) => (
                            <div key={day.date} className="flex flex-col items-center gap-2 group cursor-default">
                                <div
                                    className={`w-8 h-8 lg:w-6 lg:h-6 xl:w-8 xl:h-8 rounded-md border transition-all duration-300 relative ${day.count > 0
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
