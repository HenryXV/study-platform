'use server';

import { prisma } from '@/lib/prisma';
import { CuidSchema } from '@/lib/validation';

export async function getUnitContent(unitId: string) {
    const idResult = CuidSchema.safeParse(unitId);
    if (!idResult.success) {
        return { success: false, error: 'Invalid unit ID format' };
    }

    try {
        const unit = await prisma.studyUnit.findUnique({
            where: { id: unitId },
            select: {
                // content: true, // We want the full source text now
                source: {
                    select: {
                        title: true,
                        bodyText: true
                    }
                }
            }
        });

        if (!unit) {
            return { success: false, error: 'Unit not found' };
        }

        return {
            success: true,
            content: unit.source.bodyText,
            sourceTitle: unit.source.title
        };
    } catch (error) {
        console.error('Failed to fetch unit content:', error);
        return { success: false, error: 'Failed to fetch content' };
    }
}
