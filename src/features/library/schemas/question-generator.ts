import { z } from 'zod';

export const QuestionTypeSchema = z.enum(['MULTIPLE_CHOICE', 'OPEN', 'CODE']);

export const QuestionSchema = z.object({
    questionText: z.string().min(1, "Question text is required"),
    type: QuestionTypeSchema,
    correctAnswer: z.string().min(1, "Correct answer is required"),
    options: z.array(z.string()).optional(),
    explanation: z.string().optional(),
    topics: z.array(z.string()).optional()
});

export const ResultSchema = z.object({
    questions: z.array(QuestionSchema)
});

export type QuestionType = z.infer<typeof QuestionTypeSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type EditableQuestion = Question & { id?: string };
