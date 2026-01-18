import { prisma } from '@/lib/prisma';
import { SourceInspector } from '@/features/library/components/SourceInspector';
import { notFound } from 'next/navigation';
import { SourceMetrics } from '@/features/library/ui/SourceMetrics';

interface SourceDetailsFeatureProps {
    params: Promise<{ id: string }>;
}

export async function SourceDetailsFeature({ params }: SourceDetailsFeatureProps) {
    const { id } = await params;

    const source = await prisma.contentSource.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            bodyText: true,
            fileUrl: true,
            status: true,
            units: {
                orderBy: { createdAt: 'asc' },
                include: {
                    questions: true
                }
            },
            _count: {
                select: {
                    chunks: true
                }
            }
        }
    });

    if (!source) {
        notFound();
    }

    // Cast Prisma JSON to Typed Data
    const typedSource = {
        ...source,
        units: source.units.map(u => ({
            ...u,
            questions: u.questions.map(q => ({
                ...q,
                data: q.data as unknown as import('@/features/study-session/data/flash-cards').QuestionData
            }))
        }))
    };

    return (
        <main className="h-screen bg-zinc-950 overflow-hidden flex flex-col">
            <SourceMetrics source={source} />
            <SourceInspector source={typedSource} />
        </main>
    );
}
