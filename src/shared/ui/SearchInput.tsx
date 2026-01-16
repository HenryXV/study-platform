'use client';

import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/shared/hooks/use-debounce';

export function SearchInput() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const initialQuery = searchParams.get('query')?.toString() || '';
    const [term, setTerm] = useState(initialQuery);
    const debouncedTerm = useDebounce(term, 300);

    // Sync input if URL changes externally (e.g. back button)
    useEffect(() => {
        setTerm(initialQuery);
    }, [initialQuery]);

    useEffect(() => {
        const params = new URLSearchParams(searchParams);
        const currentQuery = params.get('query') || '';

        if (debouncedTerm === currentQuery) {
            return;
        }

        if (debouncedTerm) {
            params.set('query', debouncedTerm);
        } else {
            params.delete('query');
        }

        replace(`${pathname}?${params.toString()}`);
    }, [debouncedTerm, pathname, replace, searchParams]);

    const handleClear = () => {
        setTerm('');
        // Focus input? Optional.
    };

    return (
        <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                <Search className="w-4 h-4" />
            </div>
            <input
                type="text"
                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm rounded-lg pl-10 pr-10 py-2 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:border-zinc-700"
                placeholder="Search library..."
                value={term}
                onChange={(e) => setTerm(e.target.value)}
            />
            {term && (
                <button
                    onClick={handleClear}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}
