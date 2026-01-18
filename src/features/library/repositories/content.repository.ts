import { prisma } from '@/lib/prisma';
import { Prisma } from '@/app/generated/prisma/client';

export interface DraftData {
    suggestedSubject: string;
    suggestedTopics: string[];
    units: { title: string; type: 'TEXT' | 'CODE'; description?: string }[];
}

export const ContentRepository = {
    async findUnitById(id: string) {
        return prisma.studyUnit.findUnique({
            where: { id },
            include: {
                source: {
                    select: {
                        id: true,
                        title: true,
                        userId: true,
                        subjectId: true
                    }
                }
            }
        });
    },

    async findUnitWithContext(id: string) {
        return prisma.studyUnit.findUnique({
            where: { id },
            include: {
                source: {
                    include: {
                        subject: true,
                        topics: true
                    }
                }
            }
        });
    },

    async findSourceById(id: string, userId: string) {
        return prisma.contentSource.findFirst({
            where: { id, userId }
        });
    },

    async findSourceWithChunks(id: string, userId: string) {
        return prisma.contentSource.findFirst({
            where: { id, userId },
            include: {
                chunks: {
                    orderBy: { pageNumber: 'asc' },
                    select: {
                        id: true,
                        content: true,
                        pageNumber: true
                    }
                }
            }
        });
    },

    async createSource(userId: string, title: string, bodyText: string, fileUrl?: string) {
        return prisma.contentSource.create({
            data: {
                title,
                bodyText,
                fileUrl,
                status: 'UNPROCESSED',
                userId,
            }
        });
    },

    async findAllSources(userId: string, query?: string, limit?: number) {
        return prisma.contentSource.findMany({
            where: {
                userId,
                ...(query
                    ? {
                        OR: [
                            { title: { contains: query, mode: 'insensitive' } },
                            { bodyText: { contains: query, mode: 'insensitive' } },
                            {
                                subject: {
                                    name: { contains: query, mode: 'insensitive' },
                                },
                            },
                        ],
                    }
                    : {}
                )
            },
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                subject: {
                    select: { name: true, color: true },
                },
                topics: {
                    select: { name: true },
                },
                _count: {
                    select: { units: true },
                },
            },
        });
    },

    async deleteSource(userId: string, id: string) {
        return prisma.contentSource.deleteMany({
            where: { id, userId }
        });
    },

    async deleteUnit(userId: string, id: string) {
        return prisma.studyUnit.deleteMany({
            where: {
                id,
                source: { userId }
            }
        });
    },

    async updateUnit(userId: string, id: string, data: { content: string; description?: string }) {
        // Verify ownership/existence first (implicit via where clause with user check if we had relation, 
        // but here we might need to check source.userId if we want strict security at this level 
        // OR rely on the fact that we can do a findFirst with relation check).

        // However, Prisma doesn't easily let us update A based on B's relation in one atomic update 
        // without a slightly complex where.
        // Easiest is:
        const unit = await prisma.studyUnit.findFirst({
            where: {
                id,
                source: { userId }
            }
        });

        if (!unit) {
            return null; // or throw
        }

        return prisma.studyUnit.update({
            where: { id },
            data: {
                content: data.content,
                description: data.description
            }
        });
    },

    /** Composed transaction - contains orchestration logic for draft commit flow */
    async executeCommitDraftTransaction(userId: string, sourceId: string, data: DraftData) {
        return prisma.$transaction(async (tx) => {
            // 1. Handle Subject
            const subject = await tx.subject.upsert({
                where: {
                    name_userId: {
                        name: data.suggestedSubject,
                        userId
                    }
                },
                update: {},
                create: {
                    name: data.suggestedSubject,
                    color: "bg-blue-100 text-blue-800", // Default color
                    userId,
                },
            });

            // 2. Handle Topics
            const topics = [];
            for (const topicName of data.suggestedTopics) {
                const topic = await tx.topic.upsert({
                    where: {
                        name_subjectId_userId: {
                            name: topicName,
                            subjectId: subject.id,
                            userId
                        }
                    },
                    update: {},
                    create: {
                        name: topicName,
                        subjectId: subject.id,
                        userId
                    },
                });
                topics.push(topic);
            }

            // 3. Create Study Units
            let createdCount = 0;
            const validUnits = data.units.map(u => ({
                sourceId: sourceId,
                type: (u.type === 'CODE') ? 'CODE' : 'TEXT',
                content: u.title,
                description: u.description
            }) as Prisma.StudyUnitCreateManyInput);

            // Using createMany is more efficient if supported, but loop is fine for small batches.
            // Using loop to match original logic logic or simple create.
            for (const unitData of validUnits) {
                await tx.studyUnit.create({ data: unitData });
                createdCount++;
            }

            // 4. Update Source Status
            await tx.contentSource.update({
                where: { id: sourceId },
                data: {
                    status: 'PROCESSED',
                    subjectId: subject.id,
                    topics: {
                        connect: topics.map(t => ({ id: t.id }))
                    }
                },
            });

            return createdCount;
        });
    }
};
