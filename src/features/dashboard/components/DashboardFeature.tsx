import { DashboardMenu } from '@/features/dashboard/components/DashboardMenu';
import { Button } from '@/shared/ui/Button';
import { UserButton } from "@clerk/nextjs";
import { QuickAddForm } from '@/features/library/components/QuickAddForm';
import { ActivityHeatmap } from '@/features/dashboard/ui/ActivityHeatmap';
import { MasteryRadar } from '@/features/dashboard/ui/MasteryRadar';
import { LibraryRecentItems } from '@/features/library/components/LibraryRecentItems';
import { getWeeklyMetrics } from '@/features/dashboard/actions/get-metrics';
import { getSubjectStats } from '@/features/dashboard/actions/get-subject-stats';

export async function DashboardFeature() {
    const [metrics, stats] = await Promise.all([
        getWeeklyMetrics(),
        getSubjectStats(),
    ]);


    const { days, streak } = metrics;

    // Format date: "Friday, Jan 16"
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <main className="min-h-screen bg-zinc-950 p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* HEADER: Title & Date (Left Aligned) + User Button */}
                <header className="flex items-start justify-between">
                    <div className="flex flex-col space-y-2">
                        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">System Command</h1>
                        <p className="text-zinc-400 font-medium">
                            {dateString} <span className="text-zinc-600 mx-2">|</span> Select Protocol
                        </p>
                    </div>
                    <UserButton appearance={{
                        elements: {
                            userButtonAvatarBox: "w-10 h-10 ring-2 ring-zinc-800 hover:ring-zinc-700 transition-all"
                        }
                    }} />
                </header>

                {/* SECTION 1: Active Protocols (Menu) */}
                <section>
                    <DashboardMenu />
                </section>

                {/* SECTION 2: System Status (Heatmap & Radar) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Heatmap (8 cols) */}
                    <div className="lg:col-span-8">
                        <ActivityHeatmap data={days} streak={streak} />
                    </div>

                    {/* Radar (4 cols) */}
                    <div className="lg:col-span-4">
                        <MasteryRadar data={stats} />
                    </div>

                </section>

                {/* SECTION 3: Ingestion (Quick Add & Archive) */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Quick Add */}
                    <QuickAddForm />

                    {/* Library Recent Items */}
                    <LibraryRecentItems />

                </section>

            </div>
        </main>
    );
}
