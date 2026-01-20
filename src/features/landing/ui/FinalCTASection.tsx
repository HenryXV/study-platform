import { SectionWrapper } from '@/shared/ui/SectionWrapper';
import { Button } from '@/shared/ui/Button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function FinalCTASection() {
    const t = useTranslations('landing.finalCta');

    return (
        <SectionWrapper className="bg-zinc-950 border-t border-zinc-900 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-emerald-500/5" />
            <div className="absolute -top-24 -right-24 h-96 w-96 bg-emerald-500/10 blur-3xl rounded-full" />
            <div className="absolute -bottom-24 -left-24 h-96 w-96 bg-emerald-500/10 blur-3xl rounded-full" />

            <div className="relative mx-auto max-w-2xl text-center z-10">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                    {t('title')}
                </h2>
                <p className="mt-6 text-lg leading-8 text-zinc-400">
                    {t('subtitle')}
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                    <Link href="/sign-up">
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 h-14 px-10 text-lg shadow-xl shadow-emerald-900/20">
                            {t('cta')} <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </SectionWrapper>
    );
}
