'use client';

import { SectionWrapper } from '@/shared/ui/SectionWrapper';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function FAQSection() {
    const t = useTranslations('landing.faq');
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const questions = [
        { q: t('items.0.q'), a: t('items.0.a') },
        { q: t('items.1.q'), a: t('items.1.a') },
        { q: t('items.2.q'), a: t('items.2.a') },
        { q: t('items.3.q'), a: t('items.3.a') },
    ];

    return (
        <SectionWrapper className="bg-zinc-950">
            <div className="mx-auto max-w-2xl text-center mb-16">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {t('title')}
                </h2>
            </div>
            <div className="mx-auto max-w-3xl space-y-4">
                {questions.map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
                    >
                        <button
                            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                            className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                        >
                            <span className="font-semibold text-white">{item.q}</span>
                            <motion.div
                                animate={{ rotate: openIndex === idx ? 45 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Plus className="h-5 w-5 text-emerald-500" />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {openIndex === idx && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                >
                                    <div className="px-6 pb-6 text-zinc-400 leading-relaxed">
                                        {item.a}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </SectionWrapper>
    );
}
