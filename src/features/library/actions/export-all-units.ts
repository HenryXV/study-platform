'use server';

import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import type { QuestionModel as Question } from '@/app/generated/prisma/models';

type ExportFormat = 'json' | 'txt' | 'csv';

interface ExportResult {
    success: boolean;
    data?: string;
    filename?: string;
    contentType?: string;
    error?: string;
}

export async function exportAllUnits(sourceId: string | undefined, format: ExportFormat): Promise<ExportResult> {
    try {
        const t = await getTranslations('library.export');

        const where = sourceId ? { sourceId } : {};

        const units = await prisma.studyUnit.findMany({
            where,
            include: {
                questions: {
                    orderBy: {
                        createdAt: 'asc'
                    }
                },
                source: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!units || units.length === 0) {
            return { success: false, error: t('noUnits') };
        }

        let data = '';
        let contentType = '';
        const timestamp = new Date().toISOString().split('T')[0];
        let filename = `study_export_${timestamp}`;

        switch (format) {
            case 'json':
                const exportData = units.map(unit => ({
                    title: unit.source?.title || 'Untitled',
                    description: unit.description,
                    createdAt: unit.createdAt,
                    questions: unit.questions.map(q => q.data)
                }));
                data = JSON.stringify(exportData, null, 2);
                contentType = 'application/json';
                filename += '.json';
                break;

            case 'txt':
                units.forEach((unit, uIndex) => {
                    data += `=== Unit: ${unit.source?.title || 'Untitled'} ===\n`;
                    data += `Description: ${unit.description || 'No description'}\n\n`;

                    unit.questions.forEach((q: Question, qIndex: number) => {
                        const qData = q.data as any;
                        data += `${qIndex + 1}. [${q.type}] ${qData.question}\n`;
                        if (qData.options && Array.isArray(qData.options)) {
                            qData.options.forEach((opt: string, i: number) => {
                                data += `   ${String.fromCharCode(65 + i)}. ${opt}\n`;
                            });
                        }
                        data += `   Answer: ${qData.answer}\n\n`;
                    });
                    data += `\n----------------------------------------\n\n`;
                });
                contentType = 'text/plain';
                filename += '.txt';
                break;

            case 'csv':
                // CSV Header
                data = 'UnitTitle,Type,Question,Answer,Options,Explanation\n';

                // CSV Rows
                units.forEach(unit => {
                    const unitTitle = unit.source?.title || 'Untitled';

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

                        data += `${escape(unitTitle)},${escape(q.type)},${escape(qData.question)},${escape(qData.answer)},${escape(options)},${escape(qData.explanation)}\n`;
                    });
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
