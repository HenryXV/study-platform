import Link from 'next/link';
import { ChevronLeft, FileText, Code2, CheckCircle2, Clock } from 'lucide-react';

interface SourceMetricsProps {
    source: {
        id: string;
        title: string;
        bodyText: string;
        status: 'UNPROCESSED' | 'PROCESSED';
        units?: Array<{ id: string; type: 'TEXT' | 'CODE'; content: string }>;
    };
}

export function SourceMetrics({ source }: SourceMetricsProps) {
    const unitCount = source.units?.length || 0;
    const codeUnits = source.units?.filter(u => u.type === 'CODE').length || 0;
    // Calculate approx read time (200 wpm, avg word len 5 chars -> 1000 chars/min)
    const readTime = Math.max(1, Math.ceil(source.bodyText.length / 1000));

    // Density formatted
    const codeDensity = unitCount > 0 ? Math.round((codeUnits / unitCount) * 100) : 0;

    return (
        <div className="h-16 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-20">
            {/* Left: Nav & Title */}
            <div className="flex items-center gap-4 max-w-[40%]">
                <Link href="/library" className="p-2 -ml-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-full transition-all">
                    <ChevronLeft className="w-5 h-5" />
                </Link>
                <div className="flex flex-col overflow-hidden">
                    <h1 className="text-zinc-100 font-semibold truncate leading-tight">{source.title}</h1>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{source.id}</span>
                </div>
            </div>

            {/* Right: Metrics */}
            <div className="flex items-center gap-3 md:gap-6">
                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${source.status === 'PROCESSED'
                    ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400'
                    : 'bg-amber-950/20 border-amber-900/40 text-amber-400'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${source.status === 'PROCESSED' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {source.status === 'PROCESSED' ? 'Processed' : 'Draft'}
                </div>

                <div className="h-8 w-px bg-zinc-800 hidden md:block" />

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <div className="flex items-center gap-2" title="Total Units">
                        <FileText className="w-4 h-4 text-zinc-600" />
                        <span><span className="text-zinc-200">{unitCount}</span> Units</span>
                    </div>
                    <div className="flex items-center gap-2" title="Code Snippets">
                        <Code2 className="w-4 h-4 text-indigo-500" />
                        <span><span className="text-indigo-300">{codeUnits}</span> Code</span>
                    </div>
                    <div className="flex items-center gap-2 hidden lg:flex" title="Reading Time">
                        <Clock className="w-4 h-4 text-zinc-600" />
                        <span>{readTime} min</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
