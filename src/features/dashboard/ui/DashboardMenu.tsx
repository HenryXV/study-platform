'use client';

import React, { useState } from 'react';
import { DAILY_OPTIONS, MenuOption } from '../data/mock-menu';
import { SessionPlannerModal } from '../components/SessionPlannerModal';
import { Sparkles, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function DashboardMenu() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                {DAILY_OPTIONS.map((option) => (
                    <Link
                        key={option.title}
                        href={`/study/active?mode=${option.type === 'standard' ? 'maintenance' : option.type === 'deep' ? 'deep' : 'crisis'}`}
                        className="block h-full group"
                    >
                        <DashboardCard
                            title={option.title}
                            description={option.duration}
                            icon={option.icon}
                            mainMetric={option.questionCount}
                            metricLabel="Questions"
                            variant={option.type}
                            badgeLabel={option.type === 'deep' ? 'Intense' : undefined}
                        />
                    </Link>
                ))}

                {/* Custom Session Card */}
                <div onClick={() => setIsModalOpen(true)} className="h-full cursor-pointer group">
                    <DashboardCard
                        title="Custom"
                        description="Design your own"
                        icon={Sparkles}
                        mainMetric="∞"
                        metricLabel="Flexible"
                        variant="custom"
                        badgeLabel="Personalized"
                    />
                </div>
            </div>

            <SessionPlannerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}

interface DashboardCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    mainMetric: string | number;
    metricLabel: string;
    variant: 'standard' | 'deep' | 'crisis' | 'custom';
    badgeLabel?: string;
}

function DashboardCard({
    title,
    description,
    icon: Icon,
    mainMetric,
    metricLabel,
    variant,
    badgeLabel
}: DashboardCardProps) {

    const variants = {
        standard: {
            wrapper: "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
            icon: "text-zinc-500 group-hover:text-zinc-400",
            metric: "text-zinc-700 group-hover:text-zinc-600",
            badge: null
        },
        deep: {
            wrapper: "bg-zinc-900 border-orange-900/50 hover:border-orange-500/50 hover:bg-orange-950/10 shadow-[0_0_15px_-5px_rgba(234,88,12,0.1)] hover:shadow-[0_0_20px_-5px_rgba(234,88,12,0.3)]",
            icon: "text-orange-500/70 group-hover:text-orange-500",
            metric: "text-orange-900 group-hover:text-orange-800",
            badge: "bg-orange-500/10 text-orange-400 border-orange-500/20"
        },
        crisis: {
            wrapper: "bg-emerald-950/10 border-emerald-900/30 hover:border-emerald-500/30 hover:bg-emerald-950/20",
            icon: "text-emerald-500/70 group-hover:text-emerald-500",
            metric: "text-emerald-900 group-hover:text-emerald-800",
            badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        },
        custom: {
            wrapper: "bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20 border-violet-900/30 hover:border-violet-500/40 hover:from-violet-950/30 hover:to-fuchsia-950/30",
            icon: "text-violet-400 group-hover:text-violet-300",
            metric: "text-violet-900 group-hover:text-violet-800",
            badge: "bg-violet-500/10 text-violet-400 border-violet-500/20"
        }
    };

    const style = variants[variant];

    return (
        <Card className={cn("h-full transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between", style.wrapper)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                        {title}
                    </CardTitle>
                    <CardDescription className="font-mono text-zinc-400">
                        {description}
                    </CardDescription>
                </div>
                <Icon className={cn("h-5 w-5 transition-colors", style.icon)} />
            </CardHeader>

            <CardContent className="h-6" />

            <CardFooter className="justify-between items-end pb-6">
                <div className="flex flex-col">
                    <span className={cn("text-3xl font-bold font-mono transition-colors", style.metric)}>
                        {mainMetric}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-mono text-zinc-500 group-hover:text-zinc-400 transition-opacity">
                        {metricLabel}
                    </span>
                </div>
                {badgeLabel && (
                    <Badge variant="outline" className={cn("font-mono text-[10px] uppercase tracking-wider border", style.badge)}>
                        {badgeLabel}
                    </Badge>
                )}
            </CardFooter>
        </Card>
    );
}
