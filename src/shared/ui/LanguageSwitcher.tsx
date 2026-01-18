'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { Button } from '@/shared/ui/Button';

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLocale = () => {
        const newLocale = locale === 'en-US' ? 'pt-BR' : 'en-US';
        router.replace(pathname, { locale: newLocale });
    };

    return (
        <Button
            variant="ghost"
            onClick={toggleLocale}
            className="fixed top-4 right-4 z-50 text-2xl h-10 w-10 p-0 rounded-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 hover:bg-zinc-800"
            aria-label="Switch Language"
        >
            {locale === 'en-US' ? '🇺🇸' : '🇧🇷'}
        </Button>
    );
}
