
import { DashboardMenu } from '@/features/dashboard/components/DashboardMenu';
import { UserButton } from "@clerk/nextjs";
import { QuickAddForm } from '@/features/library/components/QuickAddForm';
import { ActivityHeatmap } from '@/features/dashboard/ui/ActivityHeatmap';
import { MasteryRadar } from '@/features/dashboard/ui/MasteryRadar';
import { LibraryRecentItems } from '@/features/library/components/LibraryRecentItems';
import { getWeeklyMetrics } from '@/features/dashboard/actions/get-metrics';
import { getSubjectStats } from '@/features/dashboard/actions/get-subject-stats';
import { getTranslations, getLocale } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth';
import { Navbar } from '@/shared/ui/Navbar';


export async function DashboardFeature() {
    const [metrics, stats, t, locale, user] = await Promise.all([
        getWeeklyMetrics(),
        getSubjectStats(),
        getTranslations('dashboard'),
        getLocale(),
        getCurrentUser(),
    ]);

    const { days, streak } = metrics;

    // Format date using the current locale
    const today = new Date();
    const dateString = today.toLocaleDateString(locale, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-zinc-950 p-8">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* HEADER: Title & Date (Left Aligned) + User Button */}
                    <header className="flex items-start justify-between">
                        <div className="flex flex-col space-y-2">
                            <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">{t('title')}</h1>
                            <p className="text-zinc-400 font-medium">
                                {dateString} <span className="text-zinc-600 mx-2">|</span> {t('subtitle')}
                            </p>
                        </div>
                    </header>

                    {/* SECTION 1: Active Protocols (Menu) */}
                    <section>
                        <DashboardMenu user={user} />
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

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Quick Add (2 cols) */}
                        <div className="lg:col-span-1">
                            <QuickAddForm />
                        </div>
                        <div className="lg:col-span-1">
                            <LibraryRecentItems />
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
