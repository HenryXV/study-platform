import { subDays, format, startOfDay } from 'date-fns';
import { calculateStreak } from '@/lib/streak-calculator';
import { DomainError } from '@/lib/errors';
import { StudyLogRepository } from '@/features/dashboard/repositories/study-log.repository';
import { SubjectRepository } from '@/features/library/repositories/subject.repository';
import { TopicRepository } from '@/features/library/repositories/topic.repository';

export interface DailyMetric {
    date: string; // ISO string 2024-01-01
    label: string;
    count: number;
    intensity: number; // 0-4
    questions?: number;
    hours?: number;
}

export interface SubjectData {
    id: string;
    name: string;
    color: string;
}

export interface TopicData {
    id: string;
    name: string;
    subjectId: string;
}

export interface SubjectStat {
    subjectId: string;
    subject: string;
    mastery: number;
    total: number;
}

/**
 * Service to handle dashboard metrics and data fetching.
 */
export async function fetchWeeklyMetrics(userId: string) {
    try {
        const today = startOfDay(new Date());
        const days: DailyMetric[] = [];

        // Generate last 21 days including today
        for (let i = 20; i >= 0; i--) {
            const d = subDays(today, i);
            days.push({
                date: d.toISOString(),
                label: format(d, 'EEE'), // Mon, Tue, etc.
                count: 0,
                intensity: 0,
                questions: 0,
                hours: 0
            });
        }

        // Build a Map for O(1) day lookups
        const dayMap = new Map(days.map(d => [startOfDay(new Date(d.date)).toISOString(), d]));

        // Fetch logs and calculate streak in parallel via Repositories
        const [logs, streakLogs] = await Promise.all([
            StudyLogRepository.findLogsForMetrics(userId, subDays(today, 20)),
            StudyLogRepository.findStreakLogs(userId)
        ]);

        // Merge logs into days using O(1) Map lookup
        for (const log of logs) {
            const logDateStr = startOfDay(log.date).toISOString();
            const day = dayMap.get(logDateStr);
            if (day) {
                day.count += log.itemsReviewed;
                day.questions = log.itemsReviewed; // Assuming 1 item = 1 question for now
                // Simple intensity mapping: >0=1, >10=2, >30=3, >50=4
                if (day.count > 50) day.intensity = 4;
                else if (day.count > 30) day.intensity = 3;
                else if (day.count > 10) day.intensity = 2;
                else if (day.count > 0) day.intensity = 1;
            }
        }

        // Calculate streak using pure function
        const streak = calculateStreak(streakLogs);

        return { days, streak };
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch dashboard metrics");
    }
}

export async function fetchSubjects(userId: string): Promise<SubjectData[]> {
    try {
        return await SubjectRepository.findAllForUser(userId);
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch subjects");
    }
}

export async function fetchTopics(userId: string, subjectIds?: string[]): Promise<TopicData[]> {
    try {
        return await TopicRepository.findAllForUser(userId, subjectIds);
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch topics");
    }
}

export async function logStudyActivity(userId: string, itemsCount: number) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check for existing log for TODAY
        const existingLog = await StudyLogRepository.findLogForDate(userId, today);

        if (existingLog) {
            await StudyLogRepository.updateLog(existingLog.id, {
                itemsReviewed: { increment: itemsCount }
            });
        } else {
            await StudyLogRepository.createLog({
                userId: userId,
                date: today,
                itemsReviewed: itemsCount
            });
        }
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to log study activity");
    }
}

export async function fetchSubjectStats(userId: string): Promise<SubjectStat[]> {
    try {
        // Repository returns data structure, Service handles Domain Logic (Mastery Calculation)
        const subjects = await SubjectRepository.findWithQuestionStats(userId);

        return subjects.map((subject) => {
            const total = subject.questions.length;
            if (total === 0) {
                return {
                    subjectId: subject.id,
                    subject: subject.name,
                    mastery: 0,
                    total: 0,
                };
            }

            const avgEase = subject.questions.reduce((acc: number, q: { easeFactor: number }) => acc + q.easeFactor, 0) / total;

            // New Formula: Map 1.3 -> 0% and 3.5 -> 100%.
            // 2.5 -> (1.2 / 2.2) = ~54%.
            let mastery = Math.max(0, ((avgEase - 1.3) / 2.2) * 100);
            if (mastery > 100) mastery = 100;

            return {
                subjectId: subject.id,
                subject: subject.name,
                mastery: Math.round(mastery),
                total,
            };
        });
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch subject statistics");
    }
}
