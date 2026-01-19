export { AI_MODELS } from './ai-models';
import { AI_MODELS } from './ai-models';

export const MODEL_RATES = {
    [AI_MODELS.CHEAP]: { input: 20, output: 60 },
    [AI_MODELS.FAST]: { input: 30, output: 300 },
    [AI_MODELS.INTELLIGENT]: { input: 60, output: 350 },
} as const;

/**
 * Calculates the resource cost in Compute Points (CP).
 * Formula: (InputTokens / 1000 * Rate.Input) + (OutputTokens / 1000 * Rate.Output)
 * Minimum Cost: 10 CP
 */
export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Find rate for model, default to FAST if unknown (safe fallback or throw?)
    // Given strict requirements, we might want to be strict, but for stability, detailed logging + fallback is better.
    // However, I'll try to find exact match first.

    // We need to iterate entries because keys are dynamic from AI_MODELS
    const entry = Object.entries(MODEL_RATES).find(([k]) => k === model);
    const rate = entry ? entry[1] : MODEL_RATES[AI_MODELS.FAST];

    const input = inputTokens || 0;
    const output = outputTokens || 0;

    const inputCost = (input / 1000) * rate.input;
    const outputCost = (output / 1000) * rate.output;

    const total = Math.ceil(inputCost + outputCost);

    // Ensure we never return NaN
    if (isNaN(total)) return 10;

    return Math.max(total, 10);
}
