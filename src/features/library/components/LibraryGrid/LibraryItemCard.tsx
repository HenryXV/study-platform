import Link from 'next/link';
import { LibraryItem } from '@/features/library/actions/get-sources';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Calendar, Trash2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface LibraryItemCardProps {
    source: LibraryItem;
    onDeleteClick: (e: React.MouseEvent, id: string) => void;
}

export function LibraryItemCard({ source, onDeleteClick }: LibraryItemCardProps) {
    return (
        // Container is now just a div (via Card), not a Link wrapper
        <div className="group block h-full relative">
            <Card className="h-full hover:border-zinc-700 hover:bg-zinc-800/50 transition-all relative flex flex-col group">
                {/* Main Link Overlay */}
                <Link
                    href={`/library/${source.id}`}
                    className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
                    aria-label={`View ${source.title}`}
                />

                <CardHeader className="pb-3 relative z-10 pointer-events-none">
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
                        <div className="flex items-center gap-2 pointer-events-auto">
                            <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(source.createdAt), 'MMM d')}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => onDeleteClick(e, source.id)}
                                className="ml-1 text-zinc-600 hover:text-red-400 hover:bg-zinc-800"
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

                <CardContent className="flex-1 relative z-10 pointer-events-none">
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

                <CardFooter className="pt-4 border-t border-zinc-800/50 mt-auto justify-between relative z-10 pointer-events-none">
                    <span className="text-xs text-zinc-500 font-mono bg-zinc-950 py-1 px-2 rounded border border-zinc-800/50">
                        {source._count.units} Units
                    </span>
                    <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors -translate-x-2 group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                </CardFooter>
            </Card>
        </div>
    );
}
