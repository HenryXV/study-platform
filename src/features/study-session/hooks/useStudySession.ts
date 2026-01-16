"use client";

import { useState } from 'react';
import { toast } from 'sonner';
import { FlashCard } from '../data/flash-cards';
import { submitReview } from '../actions/submit-review';
import { getOvertimeQuestions } from '@/features/library/actions/get-overtime-questions';

export function useStudySession(initialCards: FlashCard[]) {
    const [cards, setCards] = useState<FlashCard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const currentCard = cards[currentIndex];
    const isComplete = currentIndex >= cards.length;
    const progress = {
        current: currentIndex + 1,
        total: cards.length
    };

    const handleExtendSession = async () => {
        try {
            const currentIds = cards.map(c => c.id);
            const result = await getOvertimeQuestions(currentIds, 10);

            if (result.success && result.questions && result.questions.length > 0) {
                // Determine if we need to append the new questions
                // If we are at the end, the user will see the next card immediately
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

    const handleNext = (rating: 'FORGOT' | 'HARD' | 'EASY') => {
        if (!currentCard) return;

        // Fire and forget - Optimistic UI
        submitReview(currentCard.id, rating).catch(err => {
            console.error("Failed to submit review", err);
            toast.error("Failed to save progress for this card");
        });

        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
    };

    const handleFlip = () => setIsFlipped(true);

    return {
        currentCard,
        isComplete,
        isFlipped,
        progress,
        handleFlip,
        handleNext,
        handleExtendSession
    };
}
