import { createNavigation } from 'next-intl/navigation';
import { locales } from './routing';

export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales,
    defaultLocale: 'pt-BR',
    localePrefix: 'as-needed'
});
