import { z } from 'zod';

export const GranularityEnum = z.enum(['BROAD', 'DETAILED', 'ATOMIC']);
export type Granularity = z.infer<typeof GranularityEnum>;

export const ProcessingOptionsSchema = z.object({
    granularity: GranularityEnum.default('DETAILED'),
    focus: z.string().max(140).optional(),
    model: z.string().default('gemini-2.5-flash-lite'), // Defaults to CHEAP
});

export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;

// Prompt injection mapping for AI service
export const GRANULARITY_PROMPTS: Record<Granularity, string> = {
    BROAD: 'Generate 4-6 broad, chapter-level study units. Group heavily.',
    DETAILED: 'Generate 8-12 detailed, section-level study units (standard granularity).',
    ATOMIC: 'Generate 15+ small, concept-level atomic study units.',
};

// UI labels for the segmented control
export const GRANULARITY_LABELS: Record<Granularity, { label: string; description: string }> = {
    BROAD: { label: 'Chapters', description: '4-6 units' },
    DETAILED: { label: 'Sections', description: '8-12 units' },
    ATOMIC: { label: 'Concepts', description: '15+ units' },
};
