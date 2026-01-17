import { LibraryFeature } from '@/features/library/components/LibraryFeature';

interface LibraryPageProps {
    searchParams: Promise<{ query?: string }>;
}

export default function LibraryPage({ searchParams }: LibraryPageProps) {
    return <LibraryFeature searchParams={searchParams} />;
}
