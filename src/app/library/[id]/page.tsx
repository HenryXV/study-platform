import { prisma } from '@/lib/prisma';
import { SourceInspector } from '@/features/library/components/SourceInspector';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;

    const source = await prisma.contentSource.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            bodyText: true,
            status: true,
            units: {
                orderBy: { createdAt: 'asc' }
            }
        }
    });

    if (!source) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-zinc-950 pt-20">
            <SourceInspector source={source} />
        </main>
    );
}
