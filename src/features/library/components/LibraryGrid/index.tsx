'use client';

import { LibraryItem } from '@/features/library/actions/get-sources';
import { FileText } from 'lucide-react';
import { useState, useMemo, useTransition } from 'react';
import { Button } from '@/shared/ui/Button';
import { deleteContentSource } from '@/features/library/actions/delete-source';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { LibraryItemCard } from './LibraryItemCard';
import { useTranslations } from 'next-intl';
import { AddSourceButton } from '@/features/library/ui/AddSourceButton';

interface LibraryGridProps {
    sources: LibraryItem[];
    query?: string;
}

export function LibraryGrid({ sources, query }: LibraryGridProps) {
    const t = useTranslations('library.grid');
    const [selectedSubject, setSelectedSubject] = useState<string>('All');

    // Deletion State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.preventDefault(); // Prevent navigation
        setItemToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        startTransition(async () => {
            await deleteContentSource(itemToDelete);
            setShowDeleteModal(false);
            setItemToDelete(null);
        });
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
    };

    // Extract unique subjects
    const subjects = useMemo(() => {
        const set = new Set(sources.map((s) => s.subject?.name).filter(Boolean) as string[]);
        return ['All', ...Array.from(set)];
    }, [sources]);

    const displaySubjects = useMemo(() => {
        return subjects.map(s => s === 'All' ? { value: 'All', label: t('allSubjects') } : { value: s, label: s });
    }, [subjects, t]);

    // Filter sources
    const filteredSources = useMemo(() => {
        if (selectedSubject === 'All') return sources;
        return sources.filter((s) => s.subject?.name === selectedSubject);
    }, [sources, selectedSubject]);

    // Empty State: No matches found (Search active)
    if (sources.length === 0 && query) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-zinc-300 mb-2">{t('noMatches')}</h3>
                <p className="text-zinc-500">
                    {t.rich('noMatchesDesc', {
                        query: query,
                        span: (chunks) => <span className="text-zinc-300">"{chunks}"</span>
                    })}
                </p>
            </div>
        );
    }

    // Empty State: Library is empty (Start fresh)
    if (sources.length === 0 && !query) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-zinc-300 mb-2">{t('empty')}</h3>
                <p className="text-zinc-500 mb-6">{t('emptyDesc')}</p>
                <AddSourceButton />
            </div>
        );
    }

    return (
        <div>
            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title={t('deleteTitle')}
                message={t('deleteMessage')}
                confirmText={t('deleteConfirm')}
                isLoading={isPending}
            />

            {/* Filter Control */}
            {subjects.length > 1 && (
                <div className="mb-8 flex items-center gap-3">
                    <label htmlFor="subject-filter" className="text-sm text-zinc-400 font-medium">
                        {t('filterBySubject')}
                    </label>
                    <div className="relative">
                        <select
                            id="subject-filter"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer hover:border-zinc-700"
                        >
                            {displaySubjects.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSources.map((source) => (
                    <LibraryItemCard
                        key={source.id}
                        source={source}
                        onDeleteClick={handleDeleteClick}
                    />
                ))}
            </div>
        </div>
    );
}

