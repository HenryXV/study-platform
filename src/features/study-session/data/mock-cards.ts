export type CardType = 'TEXT' | 'CODE';

export interface FlashCard {
    id: string;
    type: CardType;
    question: string;
    answer: string;
    codeSnippet?: string;
    expected?: string;
}
