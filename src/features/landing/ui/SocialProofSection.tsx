import { useTranslations } from 'next-intl';

export function SocialProofSection() {
    const t = useTranslations('landing.socialProof');

    return (
        <section className="bg-zinc-950 border-b border-zinc-800 py-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Logos */}
                    <div>
                        <p className="text-sm font-semibold text-zinc-500 mb-4 uppercase tracking-wider">
                            {t('trustedBy')}
                        </p>
                        <div className="flex flex-wrap gap-8 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholder Text Logos for now */}
                            <span className="text-xl font-bold text-zinc-400">USP</span>
                            <span className="text-xl font-bold text-zinc-400">UNICAMP</span>
                            <span className="text-xl font-bold text-zinc-400">FGV</span>
                            <span className="text-xl font-bold text-zinc-400">UFRJ</span>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-12 md:justify-end">
                        <div className="text-center md:text-right">
                            <h3 className="text-3xl font-bold text-white">10k+</h3>
                            <p className="text-sm text-zinc-500 mt-1">{t('stats.users')}</p>
                        </div>
                        <div className="text-center md:text-right">
                            <h3 className="text-3xl font-bold text-white">1M+</h3>
                            <p className="text-sm text-zinc-500 mt-1">{t('stats.questions')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
