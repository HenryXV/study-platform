import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from '@/i18n/routing';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale,
    localePrefix: 'always',
});

const isPublicRoute = createRouteMatcher([
    '/',
    '/:locale',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/:locale/sign-in(.*)',
    '/:locale/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
    // First, handle i18n routing
    const intlResponse = intlMiddleware(request);

    // For protected routes, check auth
    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    return intlResponse;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
