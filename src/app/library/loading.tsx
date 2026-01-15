

export default function LibraryLoading() {
    return (
        <main className="min-h-screen bg-zinc-950 p-6 md:p-12 max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <div className="h-4 w-32 bg-zinc-900 rounded mb-4 animate-pulse" />
                    <div className="h-8 w-64 bg-zinc-900 rounded mb-2 animate-pulse" />
                    <div className="h-4 w-48 bg-zinc-900 rounded animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-zinc-900 rounded animate-pulse" />
            </div>

            {/* Filter Skeleton */}
            <div className="mb-8 flex items-center gap-3">
                <div className="h-4 w-24 bg-zinc-900 rounded animate-pulse" />
                <div className="h-10 w-48 bg-zinc-900 rounded animate-pulse" />
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-48 rounded-xl bg-zinc-900 border border-zinc-800 p-6 flex flex-col justify-between animate-pulse">
                        <div className="space-y-3">
                            <div className="h-4 w-24 bg-zinc-800 rounded" />
                            <div className="h-6 w-3/4 bg-zinc-800 rounded" />
                        </div>
                        <div className="flex gap-2">
                            <div className="h-8 w-16 bg-zinc-800 rounded-full" />
                            <div className="h-8 w-16 bg-zinc-800 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}

function Skeleton({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-zinc-800/50 rounded ${className}`} />
    );
}
