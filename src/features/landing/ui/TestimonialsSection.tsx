import { SectionWrapper } from '@/shared/ui/SectionWrapper';
import { useTranslations } from 'next-intl';

export function TestimonialsSection() {
    const t = useTranslations('landing.testimonials');

    const testimonials = [
        {
            name: t('items.0.name'),
            role: t('items.0.role'),
            text: t('items.0.text'),
            initial: 'S'
        },
        {
            name: t('items.1.name'),
            role: t('items.1.role'),
            text: t('items.1.text'),
            initial: 'C'
        },
        {
            name: t('items.2.name'),
            role: t('items.2.role'),
            text: t('items.2.text'),
            initial: 'J'
        }
    ];

    return (
        <SectionWrapper className="bg-zinc-950 border-t border-zinc-900">
            <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {t('title')}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((item, idx) => (
                    <div key={idx} className="bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                                {item.initial}
                            </div>
                            <div>
                                <h4 className="font-semibold text-white">{item.name}</h4>
                                <p className="text-xs text-zinc-500 uppercase tracking-wide">{item.role}</p>
                            </div>
                        </div>
                        <p className="text-zinc-300 italic">"{item.text}"</p>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}
