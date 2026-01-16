'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Question, QuestionSchema } from '@/features/library/schemas/question-generator';
import { z } from 'zod';
import { CuidSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';

export async function commitQuestions(unitId: string, questions: Question[]) {
    // 1. Validate Input
    const idResult = CuidSchema.safeParse(unitId);
    if (!idResult.success) {
        return { success: false, message: 'Invalid unit ID format' };
    }

    const parseResult = z.array(QuestionSchema).safeParse(questions);
    if (!parseResult.success) {
        return { success: false, message: "Validation failed: " + parseResult.error.issues.map(e => e.message).join(", ") };
    }
    const validQuestions = parseResult.data; // Use validated data

    const unit = await prisma.studyUnit.findUnique({
        where: { id: unitId },
        include: {
            source: {
                include: { topics: true }
            }
        }
    });

    if (!unit) {
        return { success: false, message: "Unit not found" };
    }

    try {
        const userId = await requireUser();

        await prisma.$transaction(async (tx) => {
            for (const q of validQuestions) {
                await tx.question.create({
                    data: {
                        userId,
                        unitId: unit.id,
                        type: q.type === 'CODE' ? 'SNIPPET' : (q.type === 'MULTIPLE_CHOICE' ? 'MULTI_CHOICE' : 'OPEN'),
                        subjectId: unit.source.subjectId,
                        topics: (unit.source.subjectId && q.topics?.length) ? {
                            connectOrCreate: q.topics.map(topicName => ({
                                where: {
                                    name_subjectId_userId: {
                                        name: topicName,
                                        subjectId: unit.source.subjectId!,
                                        userId
                                    }
                                },
                                create: {
                                    name: topicName,
                                    subjectId: unit.source.subjectId!,
                                    userId
                                }
                            }))
                        } : undefined,
                        data: {
                            question: q.questionText,
                            answer: q.correctAnswer,
                            options: q.options || [],
                            explanation: q.explanation || ''
                        }
                    }
                });
            }
        });

        revalidatePath('/');
        return { success: true, count: questions.length };
    } catch (error) {
        console.error("Commit Questions Failed:", error);
        return { success: false, message: "Database Error" };
    }
}
