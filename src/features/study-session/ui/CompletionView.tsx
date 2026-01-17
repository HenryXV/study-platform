"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { logStudyActivity } from '@/features/dashboard/actions/log-activity';
import { Repeat } from 'lucide-react';

interface CompletionViewProps {
    count: number;
    onExtend: () => void;
}

export function CompletionView({ count, onExtend }: CompletionViewProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await logStudyActivity(count);
            router.push('/');
        } catch (error) {
            console.error("Save failed", error);
            setIsSaving(false);
        }
    };

    const handleExtend = () => {
        startTransition(() => {
            onExtend();
        });
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-semibold text-zinc-100">Session Complete</h2>
            <p className="text-zinc-400">All cards reviewed.</p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button
                    onClick={handleExtend}
                    disabled={isPending || isSaving}
                    size="lg"
                    aria-busy={isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                >
                    {isPending ? (
                        'Finding Questions...'
                    ) : (
                        <span className="flex items-center gap-2">
                            <Repeat className="w-4 h-4" />
                            Extend Session (+10)
                        </span>
                    )}
                </Button>
                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-zinc-800"></div>
                    <span className="flex-shrink mx-4 text-zinc-600 text-xs uppercase font-medium">or</span>
                    <div className="flex-grow border-t border-zinc-800"></div>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving || isPending}
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800"
                >
                    {isSaving ? 'Saving...' : 'Save Progress & Exit'}
                </Button>
            </div>
        </div>
    );
}
