import { LucideIcon, Wrench, Zap, AlertCircle } from 'lucide-react';

export type MenuOptionType = 'standard' | 'deep' | 'crisis';

export interface MenuOption {
    title: string;
    duration: string;
    questionCount: number;
    type: MenuOptionType;
    icon: LucideIcon;
}

export const DAILY_OPTIONS: MenuOption[] = [
    {
        title: "Maintenance",
        duration: "15 min",
        questionCount: 15,
        type: "standard",
        icon: Wrench
    },
    {
        title: "Deep Flow",
        duration: "60 min",
        questionCount: 50,
        type: "deep",
        icon: Zap
    },
    {
        title: "Emergency",
        duration: "5 min",
        questionCount: 5,
        type: "crisis",
        icon: AlertCircle
    }
];
