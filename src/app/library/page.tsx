import Link from 'next/link';
import { getSources } from '@/features/library/actions/get-sources';
import { Button } from '@/shared/ui/Button'; // Kept for empty state
import { AddSourceButton } from '@/features/library/components/AddSourceButton';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

export default async function LibraryPage() {
    const sources = await getSources();

    return (
        <main className="min-h-screen bg-zinc-950 p-6 md:p-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-12">
                <div>
                    <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors text-sm font-medium mb-4">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-100 tracking-tight mb-2">My Knowledge Library</h1>
                    <p className="text-zinc-400">Manage your raw materials and study units.</p>
                </div>
                <AddSourceButton />
            </div>

            {/* List / Grid */}
            {sources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                    <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-medium text-zinc-300 mb-2">Library is empty</h3>
                    <p className="text-zinc-500 mb-6">Start by adding your first note or snippet.</p>
                    <Link href="/">
                        <Button variant="outline">Create Source</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sources.map((source) => (
                        <Link
                            key={source.id}
                            href={`/library/${source.id}`}
                            className="group block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 hover:bg-zinc-800/50 transition-all p-6 relative"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${source.status === 'PROCESSED'
                                    ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30'
                                    : 'bg-amber-950/30 text-amber-400 border-amber-900/30'
                                    }`}>
                                    {source.status === 'PROCESSED' ? 'Processed' : 'Draft'}
                                </div>
                                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(source.createdAt, 'MMM d')}
                                </span>
                            </div>

                            <h3 className="text-lg font-medium text-zinc-100 mb-2 line-clamp-2 leading-snug group-hover:text-white transition-colors">
                                {source.title}
                            </h3>

                            <div className="flex items-center justify-between mt-6">
                                <span className="text-xs text-zinc-500 font-mono bg-zinc-950 py-1 px-2 rounded border border-zinc-800/50">
                                    {source._count.units} Units
                                </span>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
