import Link from 'next/link';
import { Button } from '@/shared/ui/Button';
import { Ghost } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
    const t = await getTranslations('errors.notFound');

    return (
        <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                        <Ghost className="h-8 w-8 text-zinc-400" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-zinc-100 mb-2">
                    {t('title')}
                </h2>

                <p className="text-zinc-400 mb-8 text-sm">
                    {t('message')}
                </p>

                <Link href="/" className="w-full block">
                    <Button variant="outline" className="w-full">
                        {t('action')}
                    </Button>
                </Link>
            </div>
        </main>
    );
}
