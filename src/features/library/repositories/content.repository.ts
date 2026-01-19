import { prisma } from '@/lib/prisma';

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
            // 1. Handle Subject - single upsert
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
                    color: "bg-blue-100 text-blue-800",
                    userId,
                },
            });

            // 2. Handle Topics - parallel upserts instead of sequential loop
            const topicPromises = data.suggestedTopics.map(topicName =>
                tx.topic.upsert({
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
                })
            );
            const topics = await Promise.all(topicPromises);

            // 3. Create Study Units - use createMany for bulk insert (much more efficient)
            const unitsData = data.units.map(u => ({
                sourceId: sourceId,
                type: (u.type === 'CODE' ? 'CODE' : 'TEXT') as 'CODE' | 'TEXT',
                content: u.title,
                description: u.description ?? null
            }));

            const { count: createdCount } = await tx.studyUnit.createMany({
                data: unitsData,
                skipDuplicates: true
            });

            // 4. Update Source Status - single update with relation connect
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
