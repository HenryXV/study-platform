'use server';

import { generateText, Output } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

const QuestionSchema = z.object({
    questionText: z.string(),
    type: z.enum(['MULTIPLE_CHOICE', 'OPEN', 'CODE']),
    correctAnswer: z.string(),
    options: z.array(z.string()).optional(),
    explanation: z.string()
});

const ResultSchema = z.object({
    questions: z.array(QuestionSchema)
});

export async function generateQuestionsForUnit(unitId: string) {
    try {
        const unit = await prisma.studyUnit.findUnique({
            where: { id: unitId },
            include: {
                source: {
                    include: {
                        subject: true,
                        topics: true
                    }
                }
            }
        });

        if (!unit) {
            return { success: false, message: "Unit not found" };
        }

        const subjectName = unit.source.subject?.name || "General Knowledge";
        const topicNames = unit.source.topics.map(t => t.name).join(", ");

        const { output } = await generateText({
            model: 'google/gemini-2.0-flash-lite',
            output: Output.object({ schema: ResultSchema }),
            prompt: `
        You are a ruthless examiner. Generate 3 distinct questions for this concept.
        
        Context:
        - Domain: ${subjectName}
        - Topics: ${topicNames}
        - Concept: "${unit.content}"
        - Type: ${unit.type}
        
        Instructions:
        1. 1 Multiple Choice (with tricky distractors)
        2. 1 Open Ended (Short Answer)
        3. 1 Code Scenario (if the content involves code) or another Application question.
        
        Use the Domain and Topics context to ensure the questions are relevant and use correct terminology.
      `,
        });

        if (!output?.questions) {
            throw new Error("Failed to generate structure");
        }

        // Save to DB using transaction to handle relations
        await prisma.$transaction(async (tx) => {
            for (const q of output.questions) {
                await tx.question.create({
                    data: {
                        unitId: unit.id,
                        type: q.type === 'CODE' ? 'SNIPPET' : (q.type === 'MULTIPLE_CHOICE' ? 'MULTI_CHOICE' : 'OPEN'),
                        subjectId: unit.source.subjectId,
                        topics: {
                            connect: unit.source.topics.map(t => ({ id: t.id }))
                        },
                        data: {
                            question: q.questionText,
                            answer: q.correctAnswer,
                            options: q.options || [],
                            explanation: q.explanation
                        }
                    }
                });
            }
        });

        revalidatePath('/');
        return { success: true, count: output.questions.length };

    } catch (error) {
        console.error("Question Generation Failed:", error);
        return { success: false, message: "AI Error" };
    }
}
