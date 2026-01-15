import { StudySession } from '@/features/study-session/ui/StudySession';
import { getQuestionsForSession } from '@/features/study-session/actions/get-questions';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
    const searchParams = await props.searchParams;
    const mode = (searchParams.mode as string) || 'maintenance';

    // Fetch Real Data
    const cards = await getQuestionsForSession(mode);

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <StudySession mode={mode} initialCards={cards} />
            </div>
        </main>
    );
}
