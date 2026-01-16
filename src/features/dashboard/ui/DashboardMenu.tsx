'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DAILY_OPTIONS, MenuOption } from '../data/mock-menu';
import { SessionPlannerModal } from '../components/SessionPlannerModal';
import { Sparkles } from 'lucide-react';

export function DashboardMenu() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mx-auto">
                {DAILY_OPTIONS.map((option) => (
                    <MenuCard
                        key={option.title}
                        option={option}
                    />
                ))}

                {/* Custom Session Card */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="relative group p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 select-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950
                        bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 border-violet-900/30 hover:border-violet-500/40 hover:from-violet-950/30 hover:to-fuchsia-950/30"
                >
                    <div className="space-y-2">
                        <h3 className="text-xl font-medium tracking-tight text-zinc-50 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-400" />
                            Custom
                        </h3>
                        <p className="text-sm text-violet-200/70 font-mono">
                            Design your own
                        </p>
                    </div>

                    <div className="flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-3xl font-bold text-violet-900 group-hover:text-violet-800 transition-colors">
                                ∞
                            </span>
                            <span className="text-xs uppercase tracking-wider font-mono text-violet-500/70 group-hover:text-violet-400 transition-opacity">
                                Flexible
                            </span>
                        </div>
                        <span className="text-xs uppercase tracking-wider text-violet-500/50 font-mono mb-1">Personalized</span>
                    </div>
                </button>
            </div>

            <SessionPlannerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

function MenuCard({ option }: { option: MenuOption }) {
    const baseStyles = "relative group p-6 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 select-none block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

    const typeStyles = {
        standard: "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
        deep: "bg-zinc-900 border-orange-900/50 hover:border-orange-500/50 hover:bg-orange-950/10 shadow-[0_0_15px_-5px_rgba(234,88,12,0.1)] hover:shadow-[0_0_20px_-5px_rgba(234,88,12,0.3)]",
        crisis: "bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-500/30 hover:bg-emerald-950/20"
    };

    const textStyles = {
        standard: "text-zinc-400 group-hover:text-zinc-200",
        deep: "text-orange-200/80 group-hover:text-orange-100",
        crisis: "text-emerald-200/80 group-hover:text-emerald-100"
    };

    // Construct href based on option logic
    let mode = 'maintenance';
    if (option.title === 'Deep Flow') mode = 'deep';
    if (option.title === 'Emergency') mode = 'crisis';

    const href = `/study/active?mode=${mode}`;

    return (
        <Link
            href={href}
            className={`${baseStyles} ${typeStyles[option.type]}`}
        >
            <div className="space-y-2">
                <h3 className={`text-xl font-medium tracking-tight ${option.type === 'standard' ? 'text-zinc-100' : 'text-zinc-50'}`}>
                    {option.title}
                </h3>
                <p className={`text-sm ${textStyles[option.type]} font-mono`}>
                    {option.duration}
                </p>
            </div>

            <div className="flex items-end justify-between">
                <div className="flex flex-col">
                    <span className={`text-3xl font-bold ${option.type === 'standard' ? 'text-zinc-700 group-hover:text-zinc-600' :
                        option.type === 'deep' ? 'text-orange-900 group-hover:text-orange-800' :
                            'text-emerald-900 group-hover:text-emerald-800'
                        } transition-colors`}>
                        {option.questionCount}
                    </span>
                    <span className={`text-xs uppercase tracking-wider font-mono ${option.type === 'standard' ? 'text-zinc-500' : 'opacity-70'} group-hover:opacity-100 transition-opacity`}>
                        Questions
                    </span>
                </div>
                {option.type === 'deep' && (
                    <span className="text-xs uppercase tracking-wider text-orange-500/50 font-mono mb-1">Intense</span>
                )}
            </div>
        </Link>
    );
}
