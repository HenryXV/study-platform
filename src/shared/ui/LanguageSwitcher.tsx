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
            className="text-2xl h-8 w-8 p-0 rounded-md hover:bg-zinc-800 transition-colors"
            aria-label="Switch Language"
        >
            {locale === 'en-US' ? '🇺🇸' : '🇧🇷'}
        </Button>
    );
}
