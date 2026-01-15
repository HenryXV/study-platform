export type MenuOptionType = 'standard' | 'deep' | 'crisis';

export interface MenuOption {
    title: string;
    duration: string;
    questionCount: number;
    type: MenuOptionType;
}

export const DAILY_OPTIONS: MenuOption[] = [
    {
        title: "Maintenance",
        duration: "15 min",
        questionCount: 12,
        type: "standard"
    },
    {
        title: "Deep Flow",
        duration: "60 min",
        questionCount: 45,
        type: "deep"
    },
    {
        title: "Emergency",
        duration: "5 min",
        questionCount: 5,
        type: "crisis"
    }
];
