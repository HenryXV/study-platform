'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/ui/Button';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const t = useTranslations('errors.generic');

    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="h-12 w-12 rounded-full bg-red-900/20 flex items-center justify-center border border-red-900/30">
                        <AlertTriangle className="h-6 w-6 text-red-400" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-zinc-100 mb-2">
                    {t('title')}
                </h2>

                <p className="text-zinc-400 mb-6 text-sm">
                    {t('message')}
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={reset}
                        variant="default"
                        className="w-full"
                    >
                        {t('action')}
                    </Button>

                    {/* Optional: Add a text to show error digest for debugging if needed */}
                    {error.digest && (
                        <p className="text-xs text-zinc-600 font-mono mt-2">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}
