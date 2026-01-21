'use server';

import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import type { QuestionModel as Question } from '@/app/generated/prisma/models';
import { requireUser } from '@/lib/auth';
import { ContentRepository } from '../repositories/content.repository';

type ExportFormat = 'json' | 'txt' | 'csv';

interface ExportResult {
    success: boolean;
    data?: string;
    filename?: string;
    contentType?: string;
    error?: string;
}

export async function exportUnitData(unitId: string, format: ExportFormat): Promise<ExportResult> {
    try {
        const userId = await requireUser();
        const t = await getTranslations('library.export');

        const unit = await prisma.studyUnit.findFirst({
            where: {
                id: unitId,
                source: { userId }
            },
            include: {
                questions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                source: true
            }
        });

        if (!unit) {
            return { success: false, error: t('unitNotFound') };
        }

        let data = '';
        let contentType = '';
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitizedTitle = (unit.source?.title || 'study-unit').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        let filename = `${sanitizedTitle}_${timestamp}`;

        switch (format) {
            case 'json':
                // Export clean structure focusing on question data
                const exportData = {
                    title: unit.source?.title || 'Untitled',
                    description: unit.description,
                    createdAt: unit.createdAt,
                    questions: unit.questions.map(q => q.data)
                };
                data = JSON.stringify(exportData, null, 2);
                contentType = 'application/json';
                filename += '.json';
                break;

            case 'txt':
                data = `Study Unit: ${unit.source?.title || 'Untitled'}
Date: ${new Date().toLocaleDateString()}
Description: ${unit.description || 'No description'}

--- QUESTIONS ---
`;
                unit.questions.forEach((q: Question, index: number) => {
                    const qData = q.data as any;
                    data += `\n${index + 1}. [${q.type}] ${qData.question}\n`;
                    if (qData.options && Array.isArray(qData.options)) {
                        qData.options.forEach((opt: string, i: number) => {
                            data += `   ${String.fromCharCode(65 + i)}. ${opt}\n`;
                        });
                    }
                    data += `   Answer: ${qData.answer}\n`;
                    if (qData.explanation) {
                        data += `   Explanation: ${qData.explanation}\n`;
                    }
                });
                contentType = 'text/plain';
                filename += '.txt';
                break;

            case 'csv':
                // CSV Header
                data = 'Type,Question,Answer,Options,Explanation\n';

                // CSV Rows
                unit.questions.forEach((q: Question) => {
                    const qData = q.data as any;
                    const options = qData.options && Array.isArray(qData.options)
                        ? qData.options.join('|')
                        : '';

                    // Helper to escape CSV fields
                    const escape = (field: any) => {
                        const stringField = String(field || '');
                        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                            return `"${stringField.replace(/"/g, '""')}"`;
                        }
                        return stringField;
                    };

                    data += `${escape(q.type)},${escape(qData.question)},${escape(qData.answer)},${escape(options)},${escape(qData.explanation)}\n`;
                });
                contentType = 'text/csv';
                filename += '.csv';
                break;
        }

        return {
            success: true,
            data,
            filename,
            contentType
        };

    } catch (error) {
        console.error('Export error:', error);
        return { success: false, error: 'Failed to export data' };
    }
}
