import { z } from 'zod';

// Prisma CUID format validation
export const CuidSchema = z.string();

// Reusable ID schema with descriptive errors
export const IdParamSchema = z.object({
    id: CuidSchema,
});

// Content source input
export const ContentInputSchema = z.object({
    text: z.string().min(1, 'Content cannot be empty').max(50000, 'Content too long'),
});

// Study mode enum (extended with 'custom' for flexible sessions)
export const StudyModeSchema = z.enum(['crisis', 'deep', 'maintenance', 'custom', 'cram']);

// Limit with bounds
export const LimitSchema = z.number().int().min(1).max(100);

// Question filters for custom study sessions
export const QuestionFiltersSchema = z.object({
    subjectIds: z.array(CuidSchema).optional(),
    topicIds: z.array(CuidSchema).optional(),
    mode: StudyModeSchema.optional(),
});
