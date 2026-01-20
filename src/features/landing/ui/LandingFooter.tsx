'use client';

import { Hexagon } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function LandingFooter() {
    const t = useTranslations('landing.footer');

    return (
        <footer className="bg-zinc-950 border-t border-zinc-900 py-12 sm:py-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <Hexagon className="h-6 w-6 text-zinc-700" />
                            <span className="text-lg font-bold tracking-tight text-zinc-200">Systemizer</span>
                        </div>
                        <p className="text-sm text-zinc-500 max-w-xs">
                            {t('description')}
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-200 tracking-wider uppercase mb-4">{t('links')}</h3>
                        <ul className="space-y-3">
                            <li><a href="https://github.com/HenryXV/study-platform" className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors">GitHub</a></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    {/*
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-200 tracking-wider uppercase mb-4">{t('legal')}</h3>
                        <ul className="space-y-3">
                            <li><a href="#" className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors">{t('privacy')}</a></li>
                            <li><a href="#" className="text-sm text-zinc-500 hover:text-emerald-400 transition-colors">{t('terms')}</a></li>
                        </ul>
                    </div>
                    */}
                </div>

                <div className="mt-12 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-zinc-600">
                        {t('copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
}
