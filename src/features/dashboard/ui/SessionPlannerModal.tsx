'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { getSubjects } from '../actions/get-subjects';
import { getTopics } from '../actions/get-topics';
import { Sparkles, BookOpen, Tag, SlidersHorizontal, ChevronDown, Check, X } from 'lucide-react';

interface SubjectData {
    id: string;
    name: string;
    color: string;
}

interface TopicData {
    id: string;
    name: string;
    subjectId: string;
}

interface SessionPlannerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SessionPlannerModal({ isOpen, onClose }: SessionPlannerModalProps) {
    const router = useRouter();
    const t = useTranslations('dashboard.sessionPlanner');
    const tCommon = useTranslations('common');

    // Data state
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [topics, setTopics] = useState<TopicData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Selection state
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
    const [questionCount, setQuestionCount] = useState(20);
    const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);

    // Fetch subjects on mount
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            getSubjects().then((data) => {
                setSubjects(data);
                setIsLoading(false);
            });
        }
    }, [isOpen]);

    // Fetch topics when subjects change
    useEffect(() => {
        if (selectedSubjects.size > 0) {
            getTopics(Array.from(selectedSubjects)).then(setTopics);
        } else {
            getTopics().then(setTopics);
        }
    }, [selectedSubjects]);

    // Toggle subject selection
    const toggleSubject = useCallback((id: string) => {
        setSelectedSubjects((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
        // Clear topics when subjects change
        setSelectedTopics(new Set());
    }, []);

    // Toggle topic selection
    const toggleTopic = useCallback((id: string) => {
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Start session handler
    const handleStartSession = () => {
        const params = new URLSearchParams();
        params.set('mode', 'custom');
        params.set('limit', questionCount.toString());

        if (selectedSubjects.size > 0) {
            params.set('subjects', Array.from(selectedSubjects).join(','));
        }
        if (selectedTopics.size > 0) {
            params.set('topics', Array.from(selectedTopics).join(','));
        }

        router.push(`/study/active?${params.toString()}`);
        onClose();
    };

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setSelectedSubjects(new Set());
            setSelectedTopics(new Set());
            setQuestionCount(20);
            setIsTopicDropdownOpen(false);
        }
    }, [isOpen]);

    const filteredTopics = selectedSubjects.size > 0
        ? topics.filter(t => selectedSubjects.has(t.subjectId))
        : topics;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30">
                        <Sparkles className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-50">{t('title')}</h2>
                        <p className="text-sm text-zinc-400">{t('description')}</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Step 1: Subjects */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                <BookOpen className="w-4 h-4 text-zinc-500" />
                                <span>{t('subjects')}</span>
                                {selectedSubjects.size > 0 && (
                                    <span className="text-xs text-zinc-500">({selectedSubjects.size} {tCommon('selected')})</span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {subjects.map((subject) => {
                                    const isSelected = selectedSubjects.has(subject.id);
                                    return (
                                        <button
                                            key={subject.id}
                                            onClick={() => toggleSubject(subject.id)}
                                            className={`
                                                px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                                                border flex items-center gap-1.5
                                                ${isSelected
                                                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-200 shadow-lg shadow-violet-500/10'
                                                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600'
                                                }
                                            `}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: subject.color }}
                                            />
                                            {subject.name}
                                            {isSelected && <Check className="w-3 h-3 text-violet-400" />}
                                        </button>
                                    );
                                })}
                                {subjects.length === 0 && (
                                    <p className="text-sm text-zinc-500 italic">{tCommon('noSubjects')}</p>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Topics (Optional) */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                <Tag className="w-4 h-4 text-zinc-500" />
                                <span>{t('topics')}</span>
                                <span className="text-xs text-zinc-500">({tCommon('optional')})</span>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                                    className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-lg text-left hover:bg-zinc-800 transition-colors"
                                >
                                    <span className="text-sm text-zinc-300">
                                        {selectedTopics.size > 0
                                            ? `${selectedTopics.size} topic${selectedTopics.size > 1 ? 's' : ''} ${tCommon('selected')}`
                                            : tCommon('allTopics')
                                        }
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isTopicDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isTopicDropdownOpen && (
                                    <div className="absolute z-10 w-full mt-2 py-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                        {filteredTopics.length > 0 ? (
                                            filteredTopics.map((topic) => {
                                                const isSelected = selectedTopics.has(topic.id);
                                                return (
                                                    <button
                                                        key={topic.id}
                                                        onClick={() => toggleTopic(topic.id)}
                                                        className={`
                                                            w-full px-4 py-2 text-left text-sm flex items-center justify-between
                                                            ${isSelected
                                                                ? 'bg-violet-500/10 text-violet-200'
                                                                : 'text-zinc-300 hover:bg-zinc-800'
                                                            }
                                                        `}
                                                    >
                                                        {topic.name}
                                                        {isSelected && <Check className="w-4 h-4 text-violet-400" />}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <p className="px-4 py-2 text-sm text-zinc-500 italic">
                                                {selectedSubjects.size > 0 ? tCommon('noTopicsForSubjects') : tCommon('noTopics')}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected topics chips */}
                            {selectedTopics.size > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from(selectedTopics).map(id => {
                                        const topic = topics.find(t => t.id === id);
                                        if (!topic) return null;
                                        return (
                                            <span
                                                key={id}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300"
                                            >
                                                {topic.name}
                                                <button
                                                    onClick={() => toggleTopic(id)}
                                                    className="hover:text-red-400 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Step 3: Duration Slider */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                                    <SlidersHorizontal className="w-4 h-4 text-zinc-500" />
                                    <span>{tCommon('questions')}</span>
                                </div>
                                <span className="text-lg font-semibold text-violet-400 tabular-nums">{questionCount}</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="range"
                                    min={10}
                                    max={50}
                                    step={5}
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                    className="w-full h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer
                                        [&::-webkit-slider-thumb]:appearance-none
                                        [&::-webkit-slider-thumb]:w-5
                                        [&::-webkit-slider-thumb]:h-5
                                        [&::-webkit-slider-thumb]:rounded-full
                                        [&::-webkit-slider-thumb]:bg-violet-500
                                        [&::-webkit-slider-thumb]:shadow-lg
                                        [&::-webkit-slider-thumb]:shadow-violet-500/30
                                        [&::-webkit-slider-thumb]:cursor-pointer
                                        [&::-webkit-slider-thumb]:transition-transform
                                        [&::-webkit-slider-thumb]:hover:scale-110
                                        [&::-moz-range-thumb]:w-5
                                        [&::-moz-range-thumb]:h-5
                                        [&::-moz-range-thumb]:rounded-full
                                        [&::-moz-range-thumb]:bg-violet-500
                                        [&::-moz-range-thumb]:border-0
                                        [&::-moz-range-thumb]:cursor-pointer
                                    "
                                />
                                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                    <span>10</span>
                                    <span>30</span>
                                    <span>50</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Action Button */}
                <div className="pt-2">
                    <Button
                        onClick={handleStartSession}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
                    >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {tCommon('startSession')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
