import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
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
    '/api/webhooks(.*)',
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
    // 1. Skip i18n for for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        // For protected routes, check auth
        if (!isPublicRoute(request)) {
            await auth.protect();
        }
        return NextResponse.next();
    }

    // 2. Handle i18n routing for UI routes
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
