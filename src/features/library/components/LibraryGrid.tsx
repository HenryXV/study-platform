'use client';

import Link from 'next/link';
import { LibraryItem } from '@/features/library/actions/get-sources';
import { FileText, Calendar, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useMemo, useTransition } from 'react';
import { Button } from '@/shared/ui/Button';
import { deleteContentSource } from '../actions/delete-source';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';

interface LibraryGridProps {
    sources: LibraryItem[];
}

export function LibraryGrid({ sources }: LibraryGridProps) {
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
        const set = new Set(sources.map(s => s.subject?.name).filter(Boolean) as string[]);
        return ['All', ...Array.from(set)];
    }, [sources]);

    // Filter sources
    const filteredSources = useMemo(() => {
        if (selectedSubject === 'All') return sources;
        return sources.filter(s => s.subject?.name === selectedSubject);
    }, [sources, selectedSubject]);

    if (sources.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-zinc-600" />
                </div>
                <h3 className="text-xl font-medium text-zinc-300 mb-2">Library is empty</h3>
                <p className="text-zinc-500 mb-6">Start by adding your first note or snippet.</p>
                <Link href="/">
                    <Button variant="outline">Create Source</Button>
                </Link>
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
                title="Delete Source"
                message="Are you sure you want to delete this content source? This will permanently remove all associated study units and flashcards."
                confirmText="Delete Forever"
                isLoading={isPending}
            />

            {/* Filter Control */}
            {subjects.length > 1 && (
                <div className="mb-8 flex items-center gap-3">
                    <label htmlFor="subject-filter" className="text-sm text-zinc-400 font-medium">
                        Filter by Subject:
                    </label>
                    <div className="relative">
                        <select
                            id="subject-filter"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-lg pl-3 pr-8 py-2 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer hover:border-zinc-700"
                        >
                            {subjects.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSources.map((source) => (
                    <Link
                        key={source.id}
                        href={`/library/${source.id}`}
                        className="group block h-full"
                    >
                        <Card className="h-full hover:border-zinc-700 hover:bg-zinc-800/50 transition-all relative flex flex-col group">
                            <CardHeader className="pb-3">
                                {/* Top Metadata Row */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {source.subject ? (
                                            <Badge
                                                variant="ghost"
                                                className={source.subject.color}
                                            >
                                                {source.subject.name}
                                            </Badge>
                                        ) : (
                                            <Badge variant={source.status === 'PROCESSED' ? 'success' : 'warning'}>
                                                {source.status === 'PROCESSED' ? 'Processed' : 'Draft'}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 shrink-0">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(source.createdAt), 'MMM d')}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteClick(e, source.id)}
                                            className="ml-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 z-10"
                                            aria-label="Delete source"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="line-clamp-2 leading-snug group-hover:text-white transition-colors">
                                    {source.title}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="flex-1">
                                {/* Topics Row */}
                                {source.topics.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {source.topics.map((topic, idx) => (
                                            <Badge key={idx} variant="secondary" size="sm" className="font-normal text-zinc-400 border-zinc-700/50">
                                                #{topic.name}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-4 border-t border-zinc-800/50 mt-auto justify-between">
                                <span className="text-xs text-zinc-500 font-mono bg-zinc-950 py-1 px-2 rounded border border-zinc-800/50">
                                    {source._count.units} Units
                                </span>
                                <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                            </CardFooter>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
