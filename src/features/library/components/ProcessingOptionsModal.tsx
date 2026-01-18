'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Granularity,
    ProcessingOptions,
    GRANULARITY_LABELS,
} from '../schemas/processing-options';

interface ProcessingOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: ProcessingOptions) => void;
    isLoading?: boolean;
}

const GRANULARITY_OPTIONS: Granularity[] = ['BROAD', 'DETAILED', 'ATOMIC'];

export function ProcessingOptionsModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: ProcessingOptionsModalProps) {
    const [granularity, setGranularity] = useState<Granularity>('DETAILED');
    const [focus, setFocus] = useState('');

    const handleConfirm = () => {
        onConfirm({
            granularity,
            focus: focus.trim() || undefined,
        });
    };

    const handleFocusChange = (value: string) => {
        // Enforce 140 character limit
        setFocus(value.slice(0, 140));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-indigo-400" />
                        Processing Options
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Configure how the AI analyzes and segments your content.
                    </p>
                </div>

                {/* Granularity Selector */}
                <div className="space-y-3">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        Granularity
                    </label>
                    <div className="flex rounded-lg bg-zinc-800 p-1 gap-1">
                        {GRANULARITY_OPTIONS.map((g) => {
                            const { label, description } = GRANULARITY_LABELS[g];
                            const isSelected = granularity === g;

                            return (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setGranularity(g)}
                                    className={cn(
                                        'flex-1 px-3 py-2.5 rounded-md text-center transition-all',
                                        isSelected
                                            ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                                    )}
                                >
                                    <span className="block text-sm font-medium">{label}</span>
                                    <span className={cn(
                                        'block text-xs mt-0.5',
                                        isSelected ? 'text-zinc-600' : 'text-zinc-500'
                                    )}>
                                        {description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Focus Constraint */}
                <div className="space-y-2">
                    <label
                        htmlFor="focus-constraint"
                        className="text-xs font-medium text-zinc-400 uppercase tracking-wider"
                    >
                        Focus Constraint <span className="text-zinc-600">(optional)</span>
                    </label>
                    <textarea
                        id="focus-constraint"
                        value={focus}
                        onChange={(e) => handleFocusChange(e.target.value)}
                        placeholder='e.g. "Focus on dates and historical events" or "Split by legal competencies"'
                        className={cn(
                            'w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg p-3',
                            'text-sm text-zinc-100 placeholder:text-zinc-500',
                            'resize-none transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                        )}
                    />
                    <p className={cn(
                        'text-xs text-right transition-colors',
                        focus.length >= 130 ? 'text-amber-400' : 'text-zinc-500'
                    )}>
                        {focus.length}/140
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze Content
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
