'use client';

import { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { Sparkles, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    QuestionCount,
    QuestionTypeOption,
    QuestionGenerationOptions,
    TYPE_LABELS,
    QUESTION_TYPES,
    BANCA_LABELS,
    BANCA_OPTIONS,
} from '../schemas/question-options';
import { BancaType } from '../schemas/banca-profiles';
import { useTranslations } from 'next-intl';

interface QuestionOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (options: QuestionGenerationOptions) => void;
    isLoading?: boolean;
}

const COUNT_OPTIONS: QuestionCount[] = ['3', '5', '10'];

export function QuestionOptionsModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: QuestionOptionsModalProps) {
    const t = useTranslations('library.options');
    const tCommon = useTranslations('common');
    const [count, setCount] = useState<QuestionCount>('5');
    const [types, setTypes] = useState<QuestionTypeOption[]>(['MULTIPLE_CHOICE', 'OPEN', 'CODE']);
    const [banca, setBanca] = useState<BancaType>('STANDARD');
    const [scope, setScope] = useState('');

    const toggleType = (type: QuestionTypeOption) => {
        setTypes((prev) => {
            if (prev.includes(type)) {
                // Don't allow deselecting if it's the last one
                if (prev.length === 1) return prev;
                return prev.filter((t) => t !== type);
            }
            return [...prev, type];
        });
    };

    const handleConfirm = () => {
        onConfirm({
            count,
            types,
            banca,
            scope: scope.trim() || undefined,
        });
    };

    const handleScopeChange = (value: string) => {
        // Enforce 100 character limit
        setScope(value.slice(0, 100));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="space-y-1">
                    <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-400" />
                        {t('title')}
                    </h2>
                    <p className="text-sm text-zinc-400">
                        {t('description')}
                    </p>
                </div>

                {/* Count Selector */}
                <div className="space-y-3">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {t('count')}
                    </label>
                    <div className="flex rounded-lg bg-zinc-800 p-1 gap-1">
                        {COUNT_OPTIONS.map((c) => {
                            const isSelected = count === c;

                            return (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCount(c)}
                                    className={cn(
                                        'flex-1 px-4 py-2.5 rounded-md text-center transition-all font-medium',
                                        isSelected
                                            ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                                            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'
                                    )}
                                >
                                    {c}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Type Checkboxes */}
                <div className="space-y-3">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {t('types')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {QUESTION_TYPES.map((type) => {
                            const isSelected = types.includes(type);
                            const isOnlyOne = types.length === 1 && isSelected;

                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleType(type)}
                                    disabled={isOnlyOne}
                                    className={cn(
                                        'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-sm',
                                        isSelected
                                            ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-300'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
                                        isOnlyOne && 'opacity-60 cursor-not-allowed'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'h-4 w-4 rounded border flex items-center justify-center transition-colors',
                                            isSelected
                                                ? 'bg-indigo-500 border-indigo-500'
                                                : 'border-zinc-600 bg-transparent'
                                        )}
                                    >
                                        {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                    {TYPE_LABELS[type]}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-zinc-500">{t('atLeastOne')}</p>
                </div>

                {/* Banca Selector */}
                <div className="space-y-3">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {t('examStyle')}
                    </label>
                    <div className="relative">
                        <select
                            value={banca}
                            onChange={(e) => setBanca(e.target.value as BancaType)}
                            className={cn(
                                'w-full appearance-none bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5',
                                'text-sm text-zinc-100 cursor-pointer',
                                'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500',
                                'hover:border-zinc-600 transition-colors'
                            )}
                        >
                            {BANCA_OPTIONS.map((b) => (
                                <option key={b} value={b} className="bg-zinc-900">
                                    {BANCA_LABELS[b]}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                    </div>
                    <p className="text-xs text-zinc-500">
                        {banca === 'STANDARD' ? t('standard') : t('styledLike', { banca: BANCA_LABELS[banca] })}
                    </p>
                </div>

                {/* Scope/Focus Constraint */}
                <div className="space-y-2">
                    <label
                        htmlFor="scope-constraint"
                        className="text-xs font-medium text-zinc-400 uppercase tracking-wider"
                    >
                        {t('scope')} <span className="text-zinc-600">({tCommon('optional')})</span>
                    </label>
                    <textarea
                        id="scope-constraint"
                        value={scope}
                        onChange={(e) => handleScopeChange(e.target.value)}
                        placeholder='e.g. "Focus strictly on Art. 8" or "Ask about the exceptions, not the rule."'
                        className={cn(
                            'w-full h-16 bg-zinc-800 border border-zinc-700 rounded-lg p-3',
                            'text-sm text-zinc-100 placeholder:text-zinc-500',
                            'resize-none transition-colors',
                            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500'
                        )}
                    />
                    <p className={cn(
                        'text-xs text-right transition-colors',
                        scope.length >= 90 ? 'text-amber-400' : 'text-zinc-500'
                    )}>
                        {scope.length}/100
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
                        {tCommon('cancel')}
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        isLoading={isLoading}
                        className="flex-1"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {t('generate')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
