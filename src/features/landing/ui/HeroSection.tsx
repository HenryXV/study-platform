import { Button } from '@/shared/ui/Button';
import { ArrowRight, FileText, Terminal } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function HeroSection() {
    const t = useTranslations('landing.hero');

    return (
        <section className="relative overflow-hidden border-b border-zinc-800 bg-zinc-950 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-center lg:gap-y-10">

                    {/* Left Column: The Hook */}
                    <div className="lg:pr-8 lg:pt-4">
                        <div className="lg:max-w-lg">
                            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-6xl">
                                {t('titleStart')} <br />
                                <span className="text-zinc-400">{t('titleEnd')}</span>
                            </h1>
                            <p className="mt-6 text-lg leading-8 text-zinc-400">
                                {t('subtitle')}
                            </p>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link href="/sign-up">
                                    <Button size="lg" className="h-12 px-8 text-base font-semibold">
                                        {t('cta')} <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                                <div className="text-sm leading-6 text-zinc-400">
                                    {t('freeCredits')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Visual (Boring PDF vs Cool Card) */}
                    <div className="relative pt-16 lg:pt-0">
                        <div className="relative rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl ring-1 ring-white/10 sm:max-w-md lg:max-w-none lg:ml-auto">
                            {/* Abstract Visual representation of "Transformation" */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Boring PDF Side */}
                                <div className="space-y-2 opacity-50 blur-[1px]">
                                    <div className="flex items-center gap-2 text-zinc-500 mb-4">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-xs font-mono">{t('visual.file')}</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-800 rounded"></div>
                                    <div className="h-2 w-3/4 bg-zinc-800 rounded"></div>
                                    <div className="h-2 w-5/6 bg-zinc-800 rounded"></div>
                                    <div className="h-2 w-full bg-zinc-800 rounded"></div>
                                </div>

                                {/* Arrow */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-zinc-950 p-2 rounded-full border border-zinc-800">
                                    <ArrowRight className="h-4 w-4 text-emerald-500" />
                                </div>

                                {/* Cool Card Side */}
                                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 relative overflow-hidden">
                                    <div className="flex items-center gap-2 text-emerald-500 mb-3">
                                        <Terminal className="h-4 w-4" />
                                        <span className="text-xs font-mono font-bold">{t('visual.activeRecall')}</span>
                                    </div>
                                    <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                                        {t('visual.question')} <span className="text-emerald-400">process()</span>?
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <div className="h-6 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center text-[10px] text-emerald-400">O(n)</div>
                                        <div className="h-6 w-12 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-[10px] text-zinc-500">O(1)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
