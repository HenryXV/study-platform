'use client';

import { Badge } from '@/shared/ui/Badge';

interface CitationRendererProps {
    content: string;
}

export function CitationRenderer({ content }: CitationRendererProps) {
    // Regex to match:
    // 1. [Page 5] or [Page: 5]
    // 2. (Source 1, p.12) or (Source 1, page 12)
    const citationRegex = /(\[Page:?\s*\d+\]|\(Source\s+\d+,\s+(?:p\.|page)\s*\d+\))/g;

    const parts = content.split(citationRegex);

    return (
        <span className="whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(/^\[Page:?\s*\d+\]$/)) {
                    // Handle [Page 5] style
                    const pageNum = part.match(/\d+/)?.[0];
                    return (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="mx-1 px-1.5 py-0 text-[10px] cursor-pointer bg-blue-900/50 text-blue-200 hover:bg-blue-800 border border-blue-800 align-middle transition-colors"
                            title={`Jump to Page ${pageNum}`}
                        >
                            📄 Page {pageNum}
                        </Badge>
                    );
                } else if (part.match(/^\(Source\s+\d+,\s+(?:p\.|page)\s*\d+\)$/)) {
                    // Handle (Source 1, p.12) style
                    // clean up the text for display
                    const display = part.replace(/[()]/g, '');
                    return (
                        <Badge
                            key={index}
                            variant="secondary"
                            className="mx-1 px-1.5 py-0 text-[10px] cursor-pointer bg-blue-900/50 text-blue-200 hover:bg-blue-800 border border-blue-800 align-middle transition-colors"
                        >
                            {display}
                        </Badge>
                    );
                }

                return part;
            })}
        </span>
    );
}
