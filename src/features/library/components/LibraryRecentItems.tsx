import Link from 'next/link';
import { getSources } from '../actions/get-sources';
import { FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getTranslations } from 'next-intl/server';

export async function LibraryRecentItems() {
    const [sources, t] = await Promise.all([
        getSources(undefined, 4),
        getTranslations('library'),
    ]);

    return (
        <div className="w-full h-full flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-zinc-100">{t('archive')}</h3>
                    <Link
                        href="/library"
                        className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                    >
                        {t('viewArchive')}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
                <p className="text-sm text-zinc-400">
                    {t('archiveDescription')}
                </p>
            </div>

            <div className="flex-1 overflow-auto p-2 space-y-1">
                {sources.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2 min-h-[160px]">
                        <FileText className="w-8 h-8 opacity-20" />
                        <p className="text-sm">{t('noRecentItems')}</p>
                    </div>
                ) : (
                    sources.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-start gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${item.status === 'UNPROCESSED' ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 truncate transition-colors">
                                    {item.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {item.subject && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                            {item.subject.name}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-zinc-500">
                                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
