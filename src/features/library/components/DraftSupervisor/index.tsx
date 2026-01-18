'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { Trash2, Plus, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { DraftUnitCard, DraftUnit } from './DraftUnitCard';

export interface ApprovedDraftData {
    suggestedSubject: string;
    suggestedTopics: string[];
    units: DraftUnit[];
}

interface DraftSupervisorProps {
    initialData: ApprovedDraftData;
    onCancel: () => void;
    onCommit: (data: ApprovedDraftData) => Promise<void> | void;
}

export function DraftSupervisor({ initialData, onCancel, onCommit }: DraftSupervisorProps) {
    const [subject, setSubject] = useState(initialData.suggestedSubject);
    const [topics, setTopics] = useState(initialData.suggestedTopics);
    const [units, setUnits] = useState<DraftUnit[]>(initialData.units);
    const [newTopic, setNewTopic] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Draft Management
    const updateUnit = (index: number, field: keyof DraftUnit, value: string) => {
        const newUnits = [...units];
        newUnits[index] = { ...newUnits[index], [field]: value };
        setUnits(newUnits);
    };

    const deleteUnit = (index: number) => {
        setUnits(units.filter((_, i) => i !== index));
    };

    const addUnit = () => {
        setUnits([
            ...units,
            {
                title: 'New Concept',
                type: 'TEXT',
                description: '',
            }
        ]);
    };

    const addTopic = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newTopic.trim()) {
            if (!topics.includes(newTopic.trim())) {
                setTopics([...topics, newTopic.trim()]);
            }
            setNewTopic('');
        }
    };

    const removeTopic = (topic: string) => {
        setTopics(topics.filter(t => t !== topic));
    };

    const handleCommit = async () => {
        setIsSubmitting(true);
        try {
            await onCommit({
                suggestedSubject: subject,
                suggestedTopics: topics,
                units
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Taxonomy Editor */}
            <Card className="bg-zinc-900 border-indigo-500/30 shadow-lg shadow-indigo-500/5">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-zinc-100">Review Draft</CardTitle>
                            <p className="text-sm text-zinc-400">Verify AI-generated content before saving.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="danger" size="sm" onClick={onCancel} disabled={isSubmitting}>
                                <X className="w-4 h-4 mr-1" />
                                Discard
                            </Button>
                            <Button variant="success" size="sm" onClick={handleCommit} isLoading={isSubmitting}>
                                <Check className="w-4 h-4 mr-1" />
                                Commit to Library
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="subject-input" className="text-xs font-medium text-zinc-500 uppercase">Subject</label>
                            <input
                                id="subject-input"
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-zinc-500 uppercase">Topics (Press Enter)</label>
                            <div className="flex flex-wrap gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-md min-h-[42px]">
                                {topics.map(topic => (
                                    <Badge key={topic} variant="outline" className="bg-zinc-900 pr-1 gap-1">
                                        {topic}
                                        <button onClick={() => removeTopic(topic)} className="hover:text-red-400" aria-label={`Remove topic ${topic}`}>
                                            <X className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                                <input
                                    type="text"
                                    value={newTopic}
                                    onChange={(e) => setNewTopic(e.target.value)}
                                    onKeyDown={addTopic}
                                    placeholder="Add topic..."
                                    className="bg-transparent text-sm text-zinc-200 focus:outline-none min-w-[80px] flex-1"
                                    aria-label="Add new topic"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Units List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-medium text-zinc-300">Generated Units ({units.length})</h3>
                    <Button size="sm" variant="outline" onClick={addUnit}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Manual Unit
                    </Button>
                </div>

                <Reorder.Group axis="y" values={units} onReorder={setUnits} className="space-y-4">
                    <AnimatePresence>
                        {units.map((unit, index) => (
                            <DraftUnitCard
                                key={`${unit.title}-${index}`}
                                unit={unit}
                                index={index}
                                onUpdate={updateUnit}
                                onDelete={deleteUnit}
                            />
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {units.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-sm">
                        No units in draft. Add one manually.
                    </div>
                )}
            </div>
        </div>
    );
}
