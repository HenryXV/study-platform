export const locales = ['en-US', 'pt-BR'] as const;
export const defaultLocale = 'en-US' as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
    'en-US': 'English',
    'pt-BR': 'Português (Brasil)',
};
