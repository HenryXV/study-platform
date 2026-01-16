'use server';

import { prisma } from '@/lib/prisma';
import { QuestionSchema, EditableQuestion } from '@/features/library/schemas/question-generator';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { CuidSchema } from '@/lib/validation';

const DeletedIdsSchema = z.array(CuidSchema);

export async function updateQuestions(questions: EditableQuestion[], deletedIds: string[] = []) {
    const parseResult = z.array(QuestionSchema.extend({ id: z.string().optional() })).safeParse(questions);
    const deletedIdsResult = DeletedIdsSchema.safeParse(deletedIds);

    if (!parseResult.success) {
        return { success: false, message: "Validation failed: " + parseResult.error.issues.map(e => e.message).join(", ") };
    }

    if (!deletedIdsResult.success) {
        return { success: false, message: "Invalid deleted IDs format" };
    }

    const questionsToUpdate = parseResult.data.filter(q => q.id);
    // Allow operation if there are deletions, even if no updates
    if (questionsToUpdate.length === 0 && deletedIds.length === 0) {
        return { success: false, message: "No questions to update or delete" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Handle Deletions
            if (deletedIds.length > 0) {
                await tx.question.deleteMany({
                    where: { id: { in: deletedIds } }
                });
            }

            // 2. Handle Updates
            for (const q of questionsToUpdate) {
                if (!q.id) continue;

                // Fetch current context to ensure we have subjectId for topics
                const current = await tx.question.findUnique({
                    where: { id: q.id },
                    select: { subjectId: true }
                });

                if (!current) continue;

                await tx.question.update({
                    where: { id: q.id },
                    data: {
                        type: q.type === 'CODE' ? 'SNIPPET' : (q.type === 'MULTIPLE_CHOICE' ? 'MULTI_CHOICE' : 'OPEN'),
                        data: {
                            question: q.questionText,
                            answer: q.correctAnswer,
                            options: q.options || [],
                            explanation: q.explanation || ''
                        },
                        // Only sync topics if we have a subjectId to scope them to
                        topics: (current.subjectId && q.topics) ? {
                            set: [], // Clear current relationships for this question
                            connectOrCreate: q.topics.map(t => ({
                                where: {
                                    name_subjectId: {
                                        name: t,
                                        subjectId: current.subjectId!
                                    }
                                },
                                create: {
                                    name: t,
                                    subjectId: current.subjectId!
                                }
                            }))
                        } : undefined
                    }
                });
            }
        });

        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error("Update failed:", error);
        return { success: false, message: "Update operation failed" };
    }
}
