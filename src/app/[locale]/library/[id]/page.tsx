import { SourceDetailsFeature } from '@/features/library/components/SourceDetailsFeature';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
    return <SourceDetailsFeature params={params} />;
}
