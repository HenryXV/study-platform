import { CardType, FlashCard } from '../data/flash-cards';
import { QuestionType, Prisma } from '@/app/generated/prisma/client';
import { DomainError, NotFoundError, AuthorizationError } from '@/lib/errors';
import { QuestionRepository } from '@/features/library/repositories/question.repository';
import { ContentRepository } from '@/features/library/repositories/content.repository';

// Note: Previously named types like QuestionWithRelations are internal to implementation details 
// and mostly handled by Repository return types now.

export type StudyMode = 'smart' | 'cram' | 'crisis';

export interface QuestionFilters {
    subjectIds?: string[];
    topicIds?: string[];
    mode?: StudyMode;
}

/**
 * Service to handle fetching study questions and unit content.
 */

// --- Helper Functions ---

function mapQuestionType(type: QuestionType): CardType {
    switch (type) {
        case 'SNIPPET': return 'CODE';
        case 'MULTI_CHOICE': return 'MULTI_CHOICE';
        case 'OPEN': return 'OPEN';
        case 'CLOZE': default: return 'TEXT';
    }
}

// Map the repository result to FlashCard
function mapQuestionToFlashCard(q: any, isReviewAhead: boolean): FlashCard {
    const data = q.data as Record<string, unknown>;
    return {
        id: q.id,
        type: mapQuestionType(q.type),
        question: String(data.question || "No Question Text"),
        answer: String(data.answer || "No Answer Text"),
        options: data.options as string[] | undefined,
        codeSnippet: data.codeSnippet as string | undefined,
        expected: data.expected as string | undefined,
        explanation: data.explanation as string | undefined,
        subject: q.subject ? { name: q.subject.name, color: q.subject.color } : undefined,
        topics: q.topics.map((t: any) => ({ name: t.name })),
        isReviewAhead,
    };
}

// --- Main Service Functions ---

export async function fetchQuestions(
    userId: string,
    mode: StudyMode = 'smart',
    limit: number = 30,
    subjectFilter?: string,
    topicFilter?: string
): Promise<FlashCard[]> {
    try {
        const filter = {
            subjectId: subjectFilter,
            topicIds: topicFilter ? [topicFilter] : undefined
        };

        let finalQuestions: any[] = [];
        const now = new Date();

        // 1. Crisis Mode: Only Overdue (Priority 1) + New (Priority 2)
        if (mode === 'crisis') {
            // Fetch overdue questions up to limit
            const overdue = await QuestionRepository.findDue(userId, limit, now, filter);

            // ALWAYS fetch new questions up to limit (ignoring whether overdue filled the quota)
            // Note: This intentionally may return up to 2x limit cards
            const newCards = await QuestionRepository.findNew(userId, limit, 'desc', filter);

            return [...overdue, ...newCards].map(q => mapQuestionToFlashCard(q, false));
        }

        // 2. Due Reviews (Priority 1)
        const due = await QuestionRepository.findDue(userId, limit, now, filter);
        finalQuestions = [...due];

        // 3. New Cards (Priority 2)
        if (finalQuestions.length < limit) {
            const needed = limit - finalQuestions.length;
            const newCards = await QuestionRepository.findNew(userId, needed, 'desc', filter);
            finalQuestions = [...finalQuestions, ...newCards];
        }

        // 4. Review Ahead (Priority 3 - Only if Smart Mode)
        if (mode === 'smart' && finalQuestions.length < limit) {
            const needed = limit - finalQuestions.length;
            const threeDaysFromNow = new Date(now);
            threeDaysFromNow.setDate(now.getDate() + 3);

            const reviewAhead = await QuestionRepository.findReviewAhead(userId, needed, now, threeDaysFromNow, filter);

            // Mark these as review ahead
            const mappedAhead = reviewAhead.map(q => ({ ...q, isReviewAhead: true }));
            finalQuestions = [...finalQuestions, ...mappedAhead];
        }

        // 5. Review Ahead Fallback (For non-crisis modes not fully filled)
        if (finalQuestions.length < limit) {
            const currentIds = finalQuestions.map(q => q.id);
            const needed = limit - finalQuestions.length;

            const futureQuestions = await QuestionRepository.findFuture(userId, needed, now, currentIds, filter);

            const mappedFuture = futureQuestions.map(q => ({ ...q, isReviewAhead: true }));
            finalQuestions = [...finalQuestions, ...mappedFuture];
        }

        return finalQuestions.map(q => mapQuestionToFlashCard(q, !!q.isReviewAhead));
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch study session questions");
    }
}

export async function fetchOvertimeQuestions(
    userId: string,
    excludeIds: string[] = [],
    limit: number = 10
): Promise<FlashCard[]> {
    try {
        // 1. Priority: Due Reviews
        // Note: findScheduled (not implemented in Plan but findDue logic is similar? No, findDue filters by lte Now)
        // fetchOvertimeQuestions logic: nextReviewDate <= now. So it IS findDue.
        // But we need to exclude IDs.
        // I'll add an excludeIds param to findDue in Repo or filter in Service?
        // Service filtering is inefficient if we fetch 10 and exclude 10.
        // I should have added excludeIds to findDue.
        // FOR NOW: I will filter in memory if list is small, or assume minimal overlap.
        // Actually, `fetchQuestions` logic above doesn't exclude IDs between steps except step 5.
        // `fetchOvertimeQuestions` takes `excludeIds` from CLIENT (previous batch).

        // Strategy: Fetch slightly more to account for exclusions, or add excludeIds to Repo.
        // Implementing 'exclusion' inside Service filtering for simplicity as I didn't add it to 'findDue' repo method yet.
        // Wait, I can update Repo. But strictly, let's keep it simple.

        // Correction: I should update Repo `findDue` to support `excludeIds`.
        // But better to just filter in memory for now OR fetch using `findScheduled` equivalent.
        // Just use findDue and filter.

        const dueLimit = limit + excludeIds.length;
        const allDue = await QuestionRepository.findDue(userId, dueLimit);
        const due = allDue.filter(q => !excludeIds.includes(q.id)).slice(0, limit);

        let questions = [...due];
        const remainingLimit = limit - questions.length;

        // 2. Fallback: New Cards
        if (remainingLimit > 0) {
            const currentIds = [...excludeIds, ...questions.map(q => q.id)];
            // Fetch New Cards (Ascending order per original implementation)
            const newCards = await QuestionRepository.findNew(userId, remainingLimit + currentIds.length, 'asc', undefined, currentIds);
            // findNew in repo HAS excludeIds support! Good planning.
            // But wait, my Repo implementation for findNew DOES have excludeIds.

            questions = [...questions, ...newCards.slice(0, remainingLimit)];
        }

        return questions.map(q => mapQuestionToFlashCard(q, false));
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to fetch overtime questions");
    }
}


/**
 * Service to handle fetching unit content.
 */
export async function fetchUnitContent(userId: string, unitId: string) {
    try {
        const unit = await ContentRepository.findUnitById(unitId);

        if (!unit) {
            throw new NotFoundError("Unit not found");
        }

        if (unit.source.userId !== userId) {
            throw new AuthorizationError("Unauthorized access to unit");
        }

        return {
            content: unit.content,
            type: unit.type,
            sourceTitle: unit.source.title,
            sourceId: unit.source.id
        };
    } catch (error) {
        if (error instanceof DomainError) throw error;
        throw new DomainError("Failed to load unit content");
    }
}
