import { SectionWrapper } from '@/shared/ui/SectionWrapper';
import { BrainCircuit, Smartphone, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BenefitsSection() {
    const t = useTranslations('landing.benefits');

    const benefits = [
        {
            key: 'ai',
            logo: Wand2,
            title: t('items.ai.title'),
            description: t('items.ai.description'),
            color: 'text-purple-400',
            bg: 'bg-purple-400/10 border-purple-400/20'
        },
        {
            key: 'recall',
            logo: BrainCircuit,
            title: t('items.recall.title'),
            description: t('items.recall.description'),
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10 border-emerald-400/20'
        },
        {
            key: 'mobile',
            logo: Smartphone,
            title: t('items.mobile.title'),
            description: t('items.mobile.description'),
            color: 'text-blue-400',
            bg: 'bg-blue-400/10 border-blue-400/20'
        }
    ];

    return (
        <SectionWrapper className="bg-zinc-950/50">
            <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {t('title')}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {benefits.map((benefit) => (
                    <div
                        key={benefit.key}
                        className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-colors"
                    >
                        <div className={`w-12 h-12 rounded-lg ${benefit.bg} border flex items-center justify-center mb-6`}>
                            <benefit.logo className={`h-6 w-6 ${benefit.color}`} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">
                            {benefit.title}
                        </h3>
                        <p className="text-zinc-400 leading-relaxed">
                            {benefit.description}
                        </p>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}
