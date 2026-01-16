import { DashboardMenu } from '@/features/dashboard/ui/DashboardMenu';
import { UserButton } from "@clerk/nextjs";
import { QuickAddForm } from '@/features/library/ui/QuickAddForm';
import { ActivityHeatmap } from '@/features/dashboard/components/ActivityHeatmap';
import { MasteryRadar } from '@/features/dashboard/components/MasteryRadar';
import { getWeeklyMetrics } from '@/features/dashboard/actions/get-metrics';
import { getSubjectStats } from '@/features/dashboard/actions/get-subject-stats';
import Link from 'next/link';
import { Library } from 'lucide-react';

export default async function Page() {
  const [metrics, stats] = await Promise.all([
    getWeeklyMetrics(),
    getSubjectStats(),
  ]);

  const { days, streak } = metrics;

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 gap-8">
      <div className="w-full max-w-6xl flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">Study System</h1>
          <p className="text-zinc-400">Select your protocol for today.</p>
        </div>
        <UserButton appearance={{
          elements: {
            userButtonAvatarBox: "w-10 h-10 ring-2 ring-zinc-800 hover:ring-zinc-700 transition-all"
          }
        }} />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityHeatmap data={days} streak={streak} />
        </div>
        <div className="lg:col-span-1">
          <MasteryRadar data={stats} />
        </div>
      </div>

      <DashboardMenu />

      <Link href="/library" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 rounded-md px-2 py-1">
        <Library className="w-4 h-4" />
        View Full Library Archive
      </Link>

      <QuickAddForm />
    </main>
  );
}
