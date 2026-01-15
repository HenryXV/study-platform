import { DashboardMenu } from '@/features/dashboard/ui/DashboardMenu';
import { QuickAddForm } from '@/features/library/ui/QuickAddForm';
import { ActivityHeatmap } from '@/features/dashboard/components/ActivityHeatmap';
import { getWeeklyMetrics } from '@/features/dashboard/actions/get-metrics';
import Link from 'next/link';
import { Library } from 'lucide-react';

export default async function Page() {
  const { days, streak } = await getWeeklyMetrics();

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 gap-12">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">Study System</h1>
        <p className="text-zinc-400">Select your protocol for today.</p>
      </div>

      <ActivityHeatmap data={days} streak={streak} />

      <DashboardMenu />

      <Link href="/library" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium">
        <Library className="w-4 h-4" />
        View Full Library Archive
      </Link>

      <QuickAddForm />
    </main>
  );
}
