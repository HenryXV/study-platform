import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWeeklyMetrics, fetchSubjectStats, logStudyActivity } from '@/features/dashboard/services/dashboard-service';
import { StudyLogRepository } from '@/features/dashboard/repositories/study-log.repository';
import { SubjectRepository } from '@/features/library/repositories/subject.repository';
import { calculateStreak } from '@/lib/streak-calculator';
import { DomainError } from '@/lib/errors';
import { subDays, startOfDay } from 'date-fns';

// Mock dependencies
vi.mock('@/features/dashboard/repositories/study-log.repository', () => ({
    StudyLogRepository: {
        findLogsForMetrics: vi.fn(),
        findStreakLogs: vi.fn(),
        findLogForDate: vi.fn(),
        updateLog: vi.fn(),
        createLog: vi.fn(),
    },
}));

vi.mock('@/features/library/repositories/subject.repository', () => ({
    SubjectRepository: {
        findAllForUser: vi.fn(),
        findWithQuestionStats: vi.fn(),
    },
}));

vi.mock('@/features/library/repositories/topic.repository', () => ({
    TopicRepository: {
        findAllForUser: vi.fn(),
    },
}));

vi.mock('@/lib/streak-calculator', () => ({
    calculateStreak: vi.fn(),
}));

describe('Dashboard Service', () => {
    const userId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('fetchWeeklyMetrics', () => {
        it('should return 21 days of data with merged logs and correct calculations', async () => {
            // Arrange
            const today = startOfDay(new Date());
            const mockLogs = [
                {
                    id: 'log-1',
                    userId,
                    date: today,
                    itemsReviewed: 15,
                },
                {
                    id: 'log-2',
                    userId,
                    date: subDays(today, 1),
                    itemsReviewed: 55,
                },
            ];
            const mockStreakLogs = [{ date: new Date() }];

            vi.mocked(StudyLogRepository.findLogsForMetrics).mockResolvedValue(mockLogs as any);
            vi.mocked(StudyLogRepository.findStreakLogs).mockResolvedValue(mockStreakLogs as any);
            vi.mocked(calculateStreak).mockReturnValue(5);

            // Act
            const result = await fetchWeeklyMetrics(userId);

            // Assert
            expect(result.days).toHaveLength(21);
            expect(result.streak).toBe(5);

            // Check today's data (15 items) -> Intensity 2 (>10)
            const todayData = result.days.find(d => new Date(d.date).getTime() === today.getTime());
            expect(todayData).toBeDefined();
            expect(todayData?.count).toBe(15);
            expect(todayData?.intensity).toBe(2);

            // Check yesterday's data (55 items) -> Intensity 4 (>50)
            const yesterdayData = result.days.find(d => new Date(d.date).getTime() === startOfDay(subDays(today, 1)).getTime());
            expect(yesterdayData).toBeDefined();
            expect(yesterdayData?.count).toBe(55);
            expect(yesterdayData?.intensity).toBe(4);

            // Check empty day
            const emptyDayData = result.days.find(d => new Date(d.date).getTime() === startOfDay(subDays(today, 2)).getTime());
            expect(emptyDayData).toBeDefined();
            expect(emptyDayData?.count).toBe(0);
            expect(emptyDayData?.intensity).toBe(0);
        });

        it('should throw DomainError on repository failure', async () => {
            vi.mocked(StudyLogRepository.findLogsForMetrics).mockRejectedValue(new Error('DB Error'));

            await expect(fetchWeeklyMetrics(userId)).rejects.toThrow(DomainError);
        });
    });

    describe('fetchSubjectStats', () => {
        it('should calculate mastery correctly based on avgEase', async () => {
            // Arrange
            const mockSubjects = [
                {
                    id: 'sub-1',
                    name: 'Math',
                    questions: [
                        { easeFactor: 2.5 }, // Avg 2.5
                        { easeFactor: 2.5 },
                    ],
                },
                {
                    id: 'sub-2',
                    name: 'History',
                    questions: [
                        { easeFactor: 1.3 }, // Avg 1.3 -> 0%
                    ],
                },
                {
                    id: 'sub-3',
                    name: 'Physics',
                    questions: [
                        { easeFactor: 3.5 }, // Avg 3.5 -> 100%
                    ],
                },
            ];

            vi.mocked(SubjectRepository.findWithQuestionStats).mockResolvedValue(mockSubjects as any);

            // Act
            const result = await fetchSubjectStats(userId);

            // Assert
            // Math: (2.5 - 1.3) / 2.2 = 1.2 / 2.2 = ~54.5% -> 55%
            const math = result.find(s => s.subject === 'Math');
            expect(math?.mastery).toBe(55);

            // History: 0%
            const history = result.find(s => s.subject === 'History');
            expect(history?.mastery).toBe(0);

            // Physics: 100%
            const physics = result.find(s => s.subject === 'Physics');
            expect(physics?.mastery).toBe(100);
        });

        it('should handle subjects with no questions', async () => {
            const mockSubjects = [
                {
                    id: 'sub-1',
                    name: 'Empty',
                    questions: [],
                },
            ];

            vi.mocked(SubjectRepository.findWithQuestionStats).mockResolvedValue(mockSubjects as any);

            const result = await fetchSubjectStats(userId);

            expect(result[0].total).toBe(0);
        });

        it('should throw DomainError on repository failure', async () => {
            vi.mocked(SubjectRepository.findWithQuestionStats).mockRejectedValue(new Error('DB Error'));
            await expect(fetchSubjectStats(userId)).rejects.toThrow(DomainError);
        });
    });

    describe('logStudyActivity', () => {
        it('should increment existing log if found', async () => {
            const existingLog = { id: 'log-1', itemsReviewed: 10 };
            vi.mocked(StudyLogRepository.findLogForDate).mockResolvedValue(existingLog as any);

            await logStudyActivity(userId, 5);

            expect(StudyLogRepository.updateLog).toHaveBeenCalledWith('log-1', {
                itemsReviewed: { increment: 5 },
            });
            expect(StudyLogRepository.createLog).not.toHaveBeenCalled();
        });

        it('should create new log if none exists', async () => {
            vi.mocked(StudyLogRepository.findLogForDate).mockResolvedValue(null);

            await logStudyActivity(userId, 5);

            expect(StudyLogRepository.createLog).toHaveBeenCalledWith(expect.objectContaining({
                userId,
                itemsReviewed: 5,
            }));
            expect(StudyLogRepository.updateLog).not.toHaveBeenCalled();
        });

        it('should throw DomainError on repository failure', async () => {
            vi.mocked(StudyLogRepository.findLogForDate).mockRejectedValue(new Error('DB Error'));
            await expect(logStudyActivity(userId, 5)).rejects.toThrow(DomainError);
        });
    });
});
