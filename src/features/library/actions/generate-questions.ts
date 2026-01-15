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
        });

        if (!unit) {
            return { success: false, message: "Unit not found" };
        }

        const { output } = await generateText({
            model: 'google/gemini-2.0-flash-lite',
            output: Output.object({ schema: ResultSchema }),
            prompt: `
        You are a ruthless examiner. Generate 3 distinct questions for this concept: 
        1 Multiple Choice (with tricky distractors), 
        1 Open Ended (Short Answer), 
        and 1 Code Scenario (if the content involves code) or another Application question.
        
        Concept Content:
        "${unit.content}"
        
        Type: ${unit.type}
      `,
        });

        if (!output?.questions) {
            throw new Error("Failed to generate structure");
        }

        // Save to DB
        // Note: Prisma 'Question.options' is String[], but in DB mapped often as JSON/Text[]
        // We'll trust Prisma client mapping here.
        await prisma.question.createMany({
            data: output.questions.map(q => ({
                unitId: unit.id,
                type: q.type === 'CODE' ? 'SNIPPET' : (q.type === 'MULTIPLE_CHOICE' ? 'MULTI_CHOICE' : 'OPEN'), // Mapping to our DB Enum
                data: {
                    question: q.questionText,
                    answer: q.correctAnswer,
                    options: q.options || [],
                    explanation: q.explanation
                }
            }))
        });

        revalidatePath('/');
        return { success: true, count: output.questions.length };

    } catch (error) {
        console.error("Question Generation Failed:", error);
        return { success: false, message: "AI Error" };
    }
}
