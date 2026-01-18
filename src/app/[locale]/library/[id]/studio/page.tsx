import { SourceDetailsFeature } from '@/features/library/components/SourceDetailsFeature';

// Force dynamic because we are fetching specific user data
export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function StudioPage({ params }: PageProps) {
    return <SourceDetailsFeature params={params} />;
}

