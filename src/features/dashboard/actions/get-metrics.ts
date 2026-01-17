'use server';

import { getCurrentUser } from '@/lib/auth';
import { fetchWeeklyMetrics } from '../services/dashboard-service';

export type DailyMetric = {
    date: string;
    label: string;
    count: number;
    intensity: number; // 0-4
    questions?: number;
    hours?: number;
};

export async function getWeeklyMetrics() {
    const user = await getCurrentUser();
    return await fetchWeeklyMetrics(user.id);
}

