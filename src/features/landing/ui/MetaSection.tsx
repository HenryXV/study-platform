import { Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function MetaSection() {
    const t = useTranslations('landing.meta');

    const features = [
        {
            name: t('table.rows.efficiency.name'),
            passive: t('table.rows.efficiency.passive'),
            systemized: t('table.rows.efficiency.systemized'),
            winner: 'systemized',
        },
        {
            name: t('table.rows.retention.name'),
            passive: t('table.rows.retention.passive'),
            systemized: t('table.rows.retention.systemized'),
            winner: 'systemized',
        },
        {
            name: t('table.rows.feedback.name'),
            passive: t('table.rows.feedback.passive'),
            systemized: t('table.rows.feedback.systemized'),
            winner: 'systemized',
        },
        {
            name: t('table.rows.mentalState.name'),
            passive: t('table.rows.mentalState.passive'),
            systemized: t('table.rows.mentalState.systemized'),
            winner: 'systemized',
        },
    ];

    return (
        <div className="bg-zinc-950 py-24 sm:py-32 border-b border-zinc-800">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center mb-16">
                    <h2 className="text-base font-semibold leading-7 text-emerald-500">{t('subtitle')}</h2>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                        {t('title')}
                    </p>
                </div>

                <div className="mx-auto flow-root max-w-4xl">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <div className="relative">
                                <table className="min-w-full divide-y divide-zinc-800 text-left">
                                    <thead>
                                        <tr>
                                            <th scope="col" className="py-3.5 pl-4 pr-3 text-sm font-semibold text-zinc-400 sm:pl-0">
                                                {t('table.vector')}
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-red-400/80">
                                                {t('table.passive')}
                                            </th>
                                            <th scope="col" className="px-3 py-3.5 text-sm font-semibold text-emerald-400">
                                                {t('table.systemized')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {features.map((feature) => (
                                            <tr key={feature.name}>
                                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-zinc-300 sm:pl-0">
                                                    {feature.name}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-zinc-500 flex items-center gap-2">
                                                    <X className="h-4 w-4 text-zinc-700" />
                                                    {feature.passive}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-white bg-emerald-500/5">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                        {feature.systemized}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
