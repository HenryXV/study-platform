'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { subDays, format, startOfDay } from 'date-fns';
import { calculateStreak } from '@/lib/streak-calculator';

export interface DailyMetric {
    date: string; // ISO string 2024-01-01
    count: number;
    label: string; // "Mon", "Tue"
}

export async function getWeeklyMetrics() {
    const today = startOfDay(new Date());
    const days: DailyMetric[] = [];

    // Generate last 7 days including today
    for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        days.push({
            date: d.toISOString(),
            count: 0,
            label: format(d, 'EEE') // Mon, Tue, etc.
        });
    }

    // Build a Map for O(1) day lookups
    const dayMap = new Map(days.map(d => [startOfDay(new Date(d.date)).toISOString(), d]));

    const user = await getCurrentUser();

    // Fetch logs and calculate streak in parallel (eliminates waterfall)
    const [logs, streakLogs] = await Promise.all([
        prisma.studyLog.findMany({
            where: {
                userId: user.id,
                date: { gte: subDays(today, 6) }
            }
        }),
        prisma.studyLog.findMany({
            where: { userId: user.id, itemsReviewed: { gt: 0 } },
            orderBy: { date: 'desc' },
            select: { date: true }
        })
    ]);

    // Merge logs into days using O(1) Map lookup
    for (const log of logs) {
        const logDateStr = startOfDay(log.date).toISOString();
        const day = dayMap.get(logDateStr);
        if (day) {
            day.count += log.itemsReviewed;
        }
    }

    // Calculate streak using pure function
    const streak = calculateStreak(streakLogs);

    return { days, streak };
}

