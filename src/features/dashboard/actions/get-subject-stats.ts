'use server';

import { prisma } from '@/lib/prisma';

export interface SubjectStat {
    subject: string;
    mastery: number;
    total: number;
}

export async function getSubjectStats(): Promise<SubjectStat[]> {
    const subjects = await prisma.subject.findMany({
        include: {
            questions: {
                select: {
                    easeFactor: true,
                },
            },
        },
    });

    const stats = subjects.map((subject) => {
        const total = subject.questions.length;
        if (total === 0) {
            return {
                subject: subject.name,
                mastery: 0,
                total: 0,
            };
        }

        // Calculate average easeFactor
        // easeFactor typically starts at 2.5. Minimum is 1.3. Max is arbitrary but often caps around 3-4.
        // Let's normalize it closer to 0-100% mastery.
        // Logic: Average easeFactor. If avg >= 2.5 (default), consider it decent mastery.
        // Let's map 1.3 -> 0%, 2.5 -> 70%, 3.0+ -> 100%?
        // Simplified Logic per requirements: count total Questions and calculate average easeFactor.

        const avgEase = subject.questions.reduce((acc: number, q: { easeFactor: number }) => acc + q.easeFactor, 0) / total;

        // Adjusted Logic:
        // Ease Factor ranges from 1.3 (Hardest) to ~3.0+ (Easy).
        // 2.5 is the starting default.
        // User feedback: "2.5 ease factor equals 70% is too much".
        // New Formula: Map 1.3 -> 0% and 3.5 -> 100%.
        // 2.5 -> (1.2 / 2.2) = ~54%.

        let mastery = Math.max(0, ((avgEase - 1.3) / 2.2) * 100);
        if (mastery > 100) mastery = 100;

        return {
            subject: subject.name,
            mastery: Math.round(mastery),
            total,
        };
    });

    return stats;
}
