import { Button } from '@/shared/ui/Button';
import { Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ArcadeSection() {
    const t = useTranslations('landing.arcade');

    const tiers = [
        {
            name: t('tiers.trial.name'),
            price: 'Free',
            description: t('tiers.trial.description'),
            credits: t('tiers.trial.credits'),
            cta: t('tiers.trial.cta'),
            featured: false,
        },
        {
            name: t('tiers.refuel.name'),
            price: 'R$ 4,90',
            description: t('tiers.refuel.description'),
            credits: t('tiers.refuel.credits'),
            cta: t('tiers.refuel.cta'),
            featured: true,
        },
        {
            name: t('tiers.marathon.name'),
            price: 'R$ 14,90',
            description: t('tiers.marathon.description'),
            credits: t('tiers.marathon.credits'),
            cta: t('tiers.marathon.cta'),
            featured: false,
        },
    ];

    return (
        <div className="bg-zinc-950 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl sm:text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t('title')}</h2>
                    <p className="mt-6 text-lg leading-8 text-zinc-400">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-zinc-800 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
                    {tiers.map((tier) => (
                        <div key={tier.name} className={`p-8 sm:p-10 lg:flex-auto ${tier.featured ? 'bg-zinc-900 ring-1 ring-emerald-500/20' : ''} flex flex-col justify-between rounded-2xl`}>
                            <div>
                                <h3 className="text-base font-semibold leading-7 text-zinc-300">{tier.name}</h3>
                                <div className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-white">{tier.price}</span>
                                </div>
                                <p className="mt-6 text-base leading-7 text-zinc-400">{tier.description}</p>
                                <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-zinc-300">
                                    <li className="flex gap-x-3 items-center">
                                        <Zap className="h-5 w-5 flex-none text-emerald-500" aria-hidden="true" />
                                        {tier.credits}
                                    </li>
                                </ul>
                            </div>
                            <div className="mt-8">
                                <Button variant={tier.featured ? "default" : "outline"} className={`w-full ${tier.featured ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-0' : ''}`}>
                                    {tier.cta}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
