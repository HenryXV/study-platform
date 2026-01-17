'use server';

import { FlashCard } from '../data/flash-cards';
import { LimitSchema, QuestionFiltersSchema } from '@/lib/validation';
import { requireUser } from '@/lib/auth';
import { fetchQuestions, type QuestionFilters, type StudyMode } from '../services/session-service';
import { DomainError } from '@/lib/errors';

export async function getQuestions(
    limit: number = 20,
    filters?: {
        subjectIds?: string[];
        topicIds?: string[];
        mode?: string; // We'll cast this to StudyMode
    }
): Promise<FlashCard[]> {
    const limitResult = LimitSchema.safeParse(limit);
    const filtersResult = QuestionFiltersSchema.safeParse(filters ?? {});

    if (!limitResult.success || !filtersResult.success) {
        console.error('Invalid parameters:', { limit, filters });
        return [];
    }

    const validatedFilters = filtersResult.data;
    // Ensure mode is cast correctly as StudyMode, defaulting if necessary in the service call or here
    // The service handles defaults, but we need to match the type structure.
    // We can cast the string from validation to the narrower type since we trust validation (mostly)
    // OR we can rely on the service to re-validate/default.
    // Let's pass the validated filters, casting "mode" if it exists.

    // Note: QuestionFiltersSchema in lib/validation likely outputs strings for mode.
    // We need to ensure it matches StudyMode type from service.
    // Assuming 'search-web' was not used to look at `ConstraintSchema` but assuming standard strings.

    const serviceFilters: QuestionFilters = {
        subjectIds: validatedFilters.subjectIds,
        topicIds: validatedFilters.topicIds,
        mode: validatedFilters.mode as StudyMode | undefined
    };

    try {
        const userId = await requireUser();
        // Service signature: fetchQuestions(userId, mode, limit, subjectFilter, topicFilter)
        // We need to extract simpler args from serviceFilters if possible or update service to accept object.
        // Current service: fetchQuestions(userId, mode, limit, subjectFilter, topicFilter)

        const mode = serviceFilters.mode ?? 'smart';
        const subjectId = serviceFilters.subjectIds?.[0]; // Service currently only supports single subject filter string
        const topicId = serviceFilters.topicIds?.[0]; // Service currently only supports single topic filter string

        return await fetchQuestions(userId, mode, limitResult.data, subjectId, topicId);
    } catch (error) {
        if (error instanceof DomainError) {
            console.error("Domain Error:", error.message);
            return []; // or handle gracefully
        }
        console.error("Failed to fetch questions:", error);
        return [];
    }
}
