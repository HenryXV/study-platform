'use server';

import { prisma } from '@/lib/prisma';
import { subDays, format, startOfDay } from 'date-fns';

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

    // Fetch logs for this range
    const logs = await prisma.studyLog.findMany({
        where: {
            userId: 'demo-user',
            date: {
                gte: subDays(today, 6)
            }
        }
    });

    // Merge logs into days
    logs.forEach(log => {
        // Need to match by day. Since we stored as 'date' (midnight), simple comparison works if TZ matches.
        // To be safe, let's match by comparing formatted strings or day equality.
        const logDateStr = startOfDay(log.date).toISOString();
        const day = days.find(d => startOfDay(new Date(d.date)).toISOString() === logDateStr);
        if (day) {
            day.count += log.itemsReviewed;
        }
    });

    // Calculate Streak (Naive: Consecutive days working backward from yesterday/today)
    // For a streak to be alive, user must have studied today OR yesterday.
    // We'll calculate purely based on available logs for now (all time).
    // Actually, asking for "all time" logs might be heavy. Let's fetch the last 365 days for streak calc only if needed, 
    // or just assume streak is based on this week view for visual simplicity, BUT user asked for "Current Streak: X Days".
    // Let's make a separate lightweight query for streak.

    // Better streak logic: Search backwards until a gap is found.
    const streak = await calculateStreak();

    return { days, streak };
}

async function calculateStreak() {
    // Fetch distinct dates with activity, ordered desc
    // Prisma distinct on date is tricky if times vary, but we normalize to midnight.
    const logs = await prisma.studyLog.findMany({
        where: { userId: 'demo-user', itemsReviewed: { gt: 0 } },
        orderBy: { date: 'desc' },
        select: { date: true }
    });

    if (logs.length === 0) return 0;

    let streak = 0;
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Check if most recent is today or yesterday
    const lastActivity = startOfDay(logs[0].date);
    if (lastActivity < yesterday) {
        return 0; // Streak broken
    }

    // Verify consecutive days
    let currentDate = lastActivity;
    for (const log of logs) {
        const logDate = startOfDay(log.date);

        // Skip duplicate log entries for the same day
        if (logDate.getTime() === currentDate.getTime()) {
            continue; // Same day, already counted or it's the start
        }

        // If this log is exactly 1 day before current, increment
        if (logDate.getTime() === subDays(currentDate, 1).getTime()) {
            streak++;
            currentDate = logDate;
        } else {
            break; // Gap found
        }
    }

    // Add 1 for the first day found (since loop checks previous against current)
    return streak + 1;
}
