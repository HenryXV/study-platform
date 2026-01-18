import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export default function SignUpLoading() {
    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
            <LoadingSpinner size={32} className="text-zinc-400" />
        </main>
    );
}
