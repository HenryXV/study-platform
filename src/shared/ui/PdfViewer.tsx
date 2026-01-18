'use client';

import { useState } from 'react';

interface PdfViewerProps {
    url: string;
    title?: string;
}

export function PdfViewer({ url, title }: PdfViewerProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className="relative w-full h-full min-h-0 flex flex-col bg-zinc-950">
            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-zinc-300" />
                        <span className="text-sm text-zinc-500 font-mono">Loading PDF...</span>
                    </div>
                </div>
            )}

            {/* PDF Iframe */}
            <iframe
                src={url}
                title={title || 'PDF Viewer'}
                className="flex-1 w-full h-full min-h-0 border-0 bg-zinc-900"
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
}
