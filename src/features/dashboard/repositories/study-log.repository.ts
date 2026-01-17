import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client';

export const StudyLogRepository = {
    async findLogsForMetrics(userId: string, startDate: Date) {
        return prisma.studyLog.findMany({
            where: {
                userId,
                date: { gte: startDate }
            }
        });
    },

    async findStreakLogs(userId: string) {
        return prisma.studyLog.findMany({
            where: { userId, itemsReviewed: { gt: 0 } },
            orderBy: { date: 'desc' },
            select: { date: true }
        });
    },

    async findLogForDate(userId: string, date: Date) {
        // Ensure date is normalized to start of day if logic requires it, 
        // but repository should just take the date given usually.
        // The service 'dashboard-service' sets hours to 0,0,0,0.
        return prisma.studyLog.findFirst({
            where: {
                date,
                userId
            }
        });
    },

    async createLog(data: Prisma.StudyLogUncheckedCreateInput) {
        return prisma.studyLog.create({
            data
        });
    },

    async updateLog(id: string, data: Prisma.StudyLogUpdateInput) {
        return prisma.studyLog.update({
            where: { id },
            data
        });
    }
};
