import { StudySession } from '@/features/study-session/ui/StudySession';
import { getQuestions } from '@/features/study-session/actions/get-questions';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
    const searchParams = await props.searchParams;
    const mode = (searchParams.mode as 'crisis' | 'deep' | 'maintenance') || 'maintenance';

    // Determine Limit
    let limit = 15;
    if (mode === 'crisis') limit = 5;
    if (mode === 'deep') limit = 50;

    // Fetch Real Data
    const cards = await getQuestions(limit, mode);

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <StudySession mode={mode} initialCards={cards} />
            </div>
        </main>
    );
}
