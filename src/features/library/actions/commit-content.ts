'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ApprovedDraftData } from '../components/DraftSupervisor';
import { CuidSchema } from '@/lib/validation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';

const DraftUnitSchema = z.object({
    title: z.string().min(1).max(500),
    type: z.enum(['TEXT', 'CODE']),
});

const ApprovedDraftDataSchema = z.object({
    suggestedSubject: z.string().min(1).max(200),
    suggestedTopics: z.array(z.string().min(1).max(100)),
    units: z.array(DraftUnitSchema).min(1),
});

export async function commitContent(sourceId: string, data: ApprovedDraftData) {
    const idResult = CuidSchema.safeParse(sourceId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid source ID format' };
    }

    const dataResult = ApprovedDraftDataSchema.safeParse(data);
    if (!dataResult.success) {
        return { success: false, message: 'Invalid data format: ' + dataResult.error.issues[0].message };
    }

    try {
        const userId = await requireUser();

        const count = await prisma.$transaction(async (tx) => {
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
                    color: "bg-blue-100 text-blue-800", // Default color, will be fixed by UI logic later
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
            for (const unit of data.units) {
                await tx.studyUnit.create({
                    data: {
                        sourceId: sourceId,
                        type: unit.type,
                        content: unit.title, // Using title as the main identifier/summary
                        // For this "Draft" phase, we'll store the core atom as the Unit,
                        // and create a default question for it immediately.
                        // UPDATE: User requested NO questions to be created at this stage.
                    },
                });
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

        revalidatePath('/');
        return { success: true, count };

    } catch (error) {
        console.error('Commit Failed:', error);
        return { success: false, message: 'Failed to save content to library.' };
    }
}
