'use server';

import { FlashCard } from '@/features/study-session/data/flash-cards';
import { requireUser } from '@/lib/auth';
import { fetchOvertimeQuestions } from '@/features/study-session/services/session-service';
import { DomainError } from '@/lib/errors';

interface OvertimeQuestionResponse {
    success: boolean;
    questions?: FlashCard[];
    message?: string;
}

export async function getOvertimeQuestions(
    excludeIds: string[] = [],
    limit: number = 10
): Promise<OvertimeQuestionResponse> {
    try {
        const userId = await requireUser();
        const questions = await fetchOvertimeQuestions(userId, excludeIds, limit);

        return {
            success: true,
            questions,
        };

    } catch (error) {
        if (error instanceof DomainError) {
            return {
                success: false,
                message: error.message
            };
        }
        console.error("Failed to fetch overtime questions:", error);
        return {
            success: false,
            message: "Failed to load study cards."
        };
    }
}
