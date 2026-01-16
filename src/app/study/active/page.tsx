import { StudySession } from '@/features/study-session/ui/StudySession';
import { getQuestions } from '@/features/study-session/actions/get-questions';
import { getSubjects } from '@/features/dashboard/actions/get-subjects';
import { Sparkles } from 'lucide-react';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Page(props: { searchParams: SearchParams }) {
    const searchParams = await props.searchParams;
    const mode = (searchParams.mode as 'crisis' | 'deep' | 'maintenance' | 'custom' | 'cram') || 'maintenance';

    // Determine Limit
    let limit = 15;
    if (mode === 'crisis') limit = 5;
    if (mode === 'deep') limit = 50;

    // Parse custom limit from query params
    const customLimit = searchParams.limit
        ? parseInt(searchParams.limit as string, 10)
        : undefined;
    if (customLimit && customLimit >= 1 && customLimit <= 100) {
        limit = customLimit;
    }

    // Parse subject and topic IDs
    // Support both 'subjects' (comma-separated) and 'subjectId' (single)
    const rawSubjects = typeof searchParams.subjects === 'string' ? searchParams.subjects.split(',') : [];
    if (typeof searchParams.subjectId === 'string') {
        rawSubjects.push(searchParams.subjectId);
    }
    const subjectIds = rawSubjects.filter(Boolean);

    const topicIds = typeof searchParams.topics === 'string'
        ? searchParams.topics.split(',').filter(Boolean)
        : undefined;

    // Fetch subject names for banner (only in custom mode)
    let subjectNames: string[] = [];
    if (mode === 'custom' && subjectIds?.length) {
        const allSubjects = await getSubjects();
        subjectNames = allSubjects
            .filter(s => subjectIds.includes(s.id))
            .map(s => s.name);
    }

    // Fetch Real Data
    const cards = await getQuestions(limit, { mode, subjectIds, topicIds });

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col">
            {/* Custom Session Banner */}
            {mode === 'custom' && (
                <div className="bg-blue-950/50 border-b border-blue-800/50 px-4 py-2.5">
                    <div className="max-w-4xl mx-auto flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <p className="text-sm text-blue-200">
                            Custom Session:{' '}
                            <strong className="text-blue-100">
                                {subjectNames.length > 0
                                    ? subjectNames.join(' + ')
                                    : 'All Subjects'
                                }
                            </strong>
                            {topicIds?.length ? (
                                <span className="text-blue-300 ml-2">
                                    ({topicIds.length} topic{topicIds.length > 1 ? 's' : ''})
                                </span>
                            ) : null}
                        </p>
                    </div>
                </div>
            )}

            <div className="flex-1 flex items-center justify-center">
                <StudySession mode={mode} initialCards={cards} />
            </div>
        </main>
    );
}
