import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export default function StudyLoading() {
    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                <LoadingSpinner size={48} className="relative text-cyan-400" />
            </div>

            <div className="space-y-2 animate-pulse">
                <h2 className="text-xl font-medium text-cyan-400">Initializing Neural Link...</h2>
                <p className="text-zinc-500 text-sm">Synchronizing study protocols</p>
            </div>
        </main>
    );
}
