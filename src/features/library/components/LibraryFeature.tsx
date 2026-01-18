import Link from 'next/link';
import { getSources } from '@/features/library/actions/get-sources';
import { AddSourceButton } from '@/features/library/ui/AddSourceButton';
import { ArrowRight } from 'lucide-react';
import { LibraryGrid } from '@/features/library/components/LibraryGrid';
import { SearchInput } from '@/shared/ui/SearchInput';
import { getTranslations } from 'next-intl/server';

interface LibraryFeatureProps {
    searchParams: Promise<{ query?: string }>;
}

export async function LibraryFeature({ searchParams }: LibraryFeatureProps) {
    const [{ query }, sources, t] = await Promise.all([
        searchParams,
        getSources(undefined),
        getTranslations('library'),
    ]);

    const filteredSources = query ? await getSources(query) : sources;

    return (
        <main className="min-h-screen bg-zinc-950 p-6 md:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-8 mb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium mb-4">
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            {t('backToDashboard')}
                        </Link>
                        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">{t('title')}</h1>
                        <p className="text-zinc-400">{t('description')}</p>
                    </div>
                    <AddSourceButton />
                </div>

                {/* Search Bar */}
                <SearchInput />
            </div>

            {/* List / Grid */}
            <LibraryGrid sources={filteredSources} query={query} />
        </main>
    );
}
