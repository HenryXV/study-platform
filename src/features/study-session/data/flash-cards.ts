export type CardType = 'TEXT' | 'CODE' | 'MULTI_CHOICE' | 'OPEN';

export interface QuestionSnippet {
    question: string;
    answer: string;
    codeSnippet?: string;
}

export interface QuestionMCQ {
    question: string;
    answer: string;
    options?: string[]; // Future proofing
}

export type QuestionData = QuestionSnippet | QuestionMCQ;

export interface FlashCard {
    id: string;
    type: CardType;
    question: string;
    answer: string;
    options?: string[];
    codeSnippet?: string;
    expected?: string;
    explanation?: string;
    subject?: { name: string; color: string };
    topics?: { name: string }[];
    unitId?: string;
    isReviewAhead?: boolean;
}
