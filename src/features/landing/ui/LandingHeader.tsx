'use client';

import { Button } from '@/shared/ui/Button';
import { Hexagon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export function LandingHeader() {
    const t = useTranslations('landing.header');
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled
                    ? 'bg-zinc-950/80 backdrop-blur-md border-zinc-800 py-3'
                    : 'bg-transparent border-transparent py-6'
                }`}
        >
            <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative">
                        <Hexagon className="h-8 w-8 text-emerald-500 fill-emerald-500/20 transition-transform group-hover:scale-110 duration-300" />
                        <div className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Systemizer</span>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link href="/sign-in">
                        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                            {t('signIn')}
                        </Button>
                    </Link>
                    <Link href="/sign-up">
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-900/20">
                            {t('cta')}
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
