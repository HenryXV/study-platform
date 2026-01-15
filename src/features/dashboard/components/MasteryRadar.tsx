'use client';

import {
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Tooltip,
} from 'recharts';

interface SubjectStat {
    subject: string;
    mastery: number;
    total: number;
}

interface MasteryRadarProps {
    data: SubjectStat[];
}

export function MasteryRadar({ data }: MasteryRadarProps) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-[300px] flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/50">
                <p className="text-zinc-500 text-sm font-mono">No mastery data available yet.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden min-h-[250px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-50"></div>

            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500">Subject Mastery</h3>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="55%" outerRadius="65%" data={data}>
                    <PolarGrid stroke="#27272a" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#a1a1aa', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Mastery"
                        dataKey="mastery"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="#10b981"
                        fillOpacity={0.2}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#18181b',
                            borderColor: '#27272a',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: '#f4f4f5'
                        }}
                        itemStyle={{ color: '#10b981' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeOpacity: 0.1 }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
