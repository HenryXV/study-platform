import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/auth';
import { SourceInspector } from '@/features/library/components/SourceInspector';
import { notFound } from 'next/navigation';
import { SourceMetrics } from '@/features/library/ui/SourceMetrics';
import { Navbar } from '@/shared/ui/Navbar';

interface SourceDetailsFeatureProps {
    params: Promise<{ id: string }>;
}

export async function SourceDetailsFeature({ params }: SourceDetailsFeatureProps) {
    const { id } = await params;
    const userId = await requireUser();

    const source = await prisma.contentSource.findFirst({
        where: { id, userId },
        select: {
            id: true,
            title: true,
            bodyText: true,
            fileUrl: true,
            status: true,
            units: {
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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
        <>
            <Navbar variant="full" />
            <main className="h-[calc(100vh-3.5rem)] bg-zinc-950 overflow-hidden flex flex-col">
                <SourceMetrics source={source} />
                <SourceInspector source={typedSource} />
            </main>
        </>
    );
}
