'use server';

import { generateText, Output } from 'ai';
import { prisma } from '@/lib/prisma';
import { ResultSchema, Question } from '@/features/library/schemas/question-generator';
import { ratelimit } from '@/lib/ratelimit';
import { auth } from '@clerk/nextjs/server';

export async function generateQuestionsPreview(
    unitId: string,
    unitContent: string,
    unitType: 'TEXT' | 'CODE'
): Promise<{ success: boolean; questions?: Question[]; message?: string }> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, message: "Unauthorized" };
    }

    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    try {
        // MATCHING LOGIC FROM generate-questions.ts
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

        // Return questions with default topics mapped to their names if not generated
        const questionsWithTopics = output.questions.map(q => ({
            ...q,
            topics: q.topics && q.topics.length > 0 ? q.topics : unit.source.topics.map(t => t.name)
        }));

        return { success: true, questions: questionsWithTopics };

    } catch (error) {
        console.error("Question Preview Generation Failed:", error);
        return { success: false, message: "AI Error during preview generation" };
    }
}
