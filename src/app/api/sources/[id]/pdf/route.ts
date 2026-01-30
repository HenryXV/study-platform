'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Authenticated PDF proxy route.
 * 
 * This endpoint serves PDFs securely by:
 * 1. Validating user authentication via Clerk
 * 2. Verifying the user owns the requested source
 * 3. Fetching the PDF from Vercel Blob
 * 4. Streaming it back to the client
 * 
 * This provides privacy for PDFs even though Vercel Blob only supports public access.
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 2. Get source and verify ownership
        const { id } = await params;
        const source = await prisma.contentSource.findFirst({
            where: { id, userId },
            select: { fileUrl: true, title: true }
        });

        if (!source) {
            return new NextResponse('Not Found', { status: 404 });
        }

        if (!source.fileUrl) {
            return new NextResponse('No PDF available for this source', { status: 404 });
        }

        // 3. Fetch PDF from Vercel Blob
        const blobResponse = await fetch(source.fileUrl);

        if (!blobResponse.ok) {
            console.error(`Failed to fetch blob: ${blobResponse.status}`);
            return new NextResponse('Failed to retrieve PDF', { status: 502 });
        }

        // 4. Stream the response back with proper headers
        const headers = new Headers();
        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(source.title)}.pdf"`);
        headers.set('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour, private only
        headers.set('X-Content-Type-Options', 'nosniff');

        // Forward content-length if available
        const contentLength = blobResponse.headers.get('content-length');
        if (contentLength) {
            headers.set('Content-Length', contentLength);
        }

        return new NextResponse(blobResponse.body, {
            status: 200,
            headers
        });

    } catch (error) {
        console.error('PDF proxy error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
