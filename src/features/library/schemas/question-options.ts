import { z } from 'zod';
import { BancaType } from './banca-profiles';


export const QuestionCountEnum = z.enum(['3', '5', '10']);
export type QuestionCount = z.infer<typeof QuestionCountEnum>;

// Maps to existing QuestionTypeSchema values
export const QuestionTypeOptionEnum = z.enum(['MULTIPLE_CHOICE', 'OPEN', 'CODE']);
export type QuestionTypeOption = z.infer<typeof QuestionTypeOptionEnum>;

// Banca enum for Zod validation
export const BancaEnum = z.enum(['STANDARD', 'FGV', 'CESPE', 'VUNESP', 'FCC', 'CESGRANRIO']);

export const QuestionGenerationOptionsSchema = z.object({
    count: QuestionCountEnum.default('5'),
    types: z.array(QuestionTypeOptionEnum).min(1, 'Select at least one type').default(['MULTIPLE_CHOICE', 'OPEN', 'CODE']),
    banca: BancaEnum.default('STANDARD'),
    scope: z.string().max(100).optional(),
});

export type QuestionGenerationOptions = z.infer<typeof QuestionGenerationOptionsSchema>;

// UI labels for display
export const TYPE_LABELS: Record<QuestionTypeOption, string> = {
    MULTIPLE_CHOICE: 'Multiple Choice',
    OPEN: 'Open Ended',
    CODE: 'Scenario',
};

// All available types for iteration
export const QUESTION_TYPES: QuestionTypeOption[] = ['MULTIPLE_CHOICE', 'OPEN', 'CODE'];

// Banca UI labels
export const BANCA_LABELS: Record<BancaType, string> = {
    STANDARD: 'Standard',
    FGV: 'FGV',
    CESPE: 'CESPE',
    VUNESP: 'VUNESP',
    FCC: 'FCC',
    CESGRANRIO: 'CESGRANRIO',
};

// All available bancas for iteration
export const BANCA_OPTIONS: BancaType[] = ['STANDARD', 'FGV', 'CESPE', 'VUNESP', 'FCC', 'CESGRANRIO'];
