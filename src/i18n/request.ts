import { getRequestConfig } from 'next-intl/server';
import { locales, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // Get the locale from the request (set by middleware)
    let locale = await requestLocale;

    // Validate that the incoming locale is valid
    if (!locale || !locales.includes(locale as Locale)) {
        locale = 'en-US';
    }

    return {
        locale,
        messages: (await import(`../../messages/${locale}.json`)).default,
    };
});
