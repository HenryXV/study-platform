export default function DashboardLoading() {
    return (
        <main className="min-h-screen bg-zinc-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">

                {/* HEADER Skeleton */}
                <header className="flex items-start justify-between">
                    <div className="flex flex-col space-y-2">
                        <div className="h-10 w-64 bg-zinc-900 rounded" />
                        <div className="h-6 w-48 bg-zinc-900 rounded" />
                    </div>
                    <div className="w-10 h-10 bg-zinc-900 rounded-full" />
                </header>

                {/* SECTION 1: Active Protocols (Menu) Skeleton */}
                <section className="h-16 bg-zinc-900 rounded-lg border border-zinc-800" />

                {/* SECTION 2: System Status Skeleton */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Heatmap Skeleton */}
                    <div className="lg:col-span-8 h-[300px] bg-zinc-900 rounded-xl border border-zinc-800" />

                    {/* Radar Skeleton */}
                    <div className="lg:col-span-4 h-[300px] bg-zinc-900 rounded-xl border border-zinc-800" />
                </section>

                {/* SECTION 3: Ingestion Skeleton */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Quick Add Skeleton */}
                    <div className="h-[200px] bg-zinc-900 rounded-xl border border-zinc-800" />

                    {/* Recent Items Skeleton */}
                    <div className="h-[200px] bg-zinc-900 rounded-xl border border-zinc-800" />
                </section>

            </div>
        </main>
    );
}
