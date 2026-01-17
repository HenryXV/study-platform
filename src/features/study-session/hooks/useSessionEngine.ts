"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { FlashCard } from '../data/flash-cards';
import { submitReview } from '../actions/submit-review';
import { getOvertimeQuestions } from '@/features/library/actions/get-overtime-questions';

export function useSessionEngine(initialCards: FlashCard[]) {
    const [cards, setCards] = useState<FlashCard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentCard = cards[currentIndex];
    const isFinished = currentIndex >= cards.length;
    const progress = {
        current: currentIndex + 1,
        total: cards.length
    };

    const submitAnswer = async (rating: 'FORGOT' | 'HARD' | 'EASY') => {
        if (!currentCard) return;

        // Optimistic update - fire and forget
        submitReview(currentCard.id, rating).catch(err => {
            console.error("Failed to submit review", err);
            toast.error("Failed to save progress for this card");
        });

        setCurrentIndex((prev) => prev + 1);
    };

    const extendSession = async () => {
        try {
            const currentIds = cards.map(c => c.id);
            const result = await getOvertimeQuestions(currentIds, 10);

            if (result.success && result.questions && result.questions.length > 0) {
                setCards(prev => [...prev, ...result.questions!]);
                toast.success(`Added ${result.questions.length} more cards!`);
            } else {
                toast.info("No more cards available right now!");
            }
        } catch (error) {
            toast.error("Failed to extend session");
            console.error(error);
        }
    };

    return {
        currentCard,
        isFinished,
        progress,
        submitAnswer,
        extendSession
    };
}
