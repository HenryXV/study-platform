import { ActiveSessionFeature } from '@/features/study-session/components/ActiveSessionFeature';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default function Page(props: { searchParams: SearchParams }) {
    return <ActiveSessionFeature searchParams={props.searchParams} />;
}
