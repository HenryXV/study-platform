'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Editor from '@monaco-editor/react';
import { ExplanationReveal } from './ExplanationReveal';

interface CodeCardProps {
    question: string;
    initialCode?: string;
    expectedAnswer?: string;
    isFlipped: boolean;
    explanation?: string;
    unitId?: string;
}

export function CodeCard({ question, initialCode = '', expectedAnswer = '', isFlipped, explanation, unitId }: CodeCardProps) {
    const [userCode, setUserCode] = useState(initialCode);
    const t = useTranslations('study.card');
    const tStudy = useTranslations('study');

    return (
        <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-300">
            {/* Question Header */}
            <h3 className="text-xl md:text-2xl font-medium text-zinc-100 leading-tight">
                {question}
            </h3>

            {!isFlipped ? (
                /* FRONT: Input Area */
                <div className="w-full flex-1 flex flex-col min-h-[300px]">
                    <label className="block text-xs uppercase tracking-wider text-green-400 mb-2 font-mono">
                        {t('terminalInput')}
                    </label>
                    <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 relative min-h-[300px] flex flex-col">
                        <Editor
                            height="300px"
                            defaultLanguage="javascript"
                            theme="vs-dark"
                            value={userCode}
                            onChange={(value) => setUserCode(value || '')}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: '"JetBrains Mono", monospace',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                renderLineHighlight: 'none',
                                contextmenu: false,
                                padding: { top: 16, bottom: 16 },
                                readOnly: false,
                                domReadOnly: false
                            }}
                        />
                    </div>
                </div>
            ) : (
                /* BACK: Comparison View */
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 grid grid-rows-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-zinc-500 font-mono">{t('yourSolution')}</span>
                            <div className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap custom-scrollbar">
                                {userCode || <span className="text-zinc-700 italic">{t('noCode')}</span>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-green-400 font-mono">{tStudy('expectedAnswer')}</span>
                            <div className="w-full bg-zinc-950 p-3 rounded-lg border border-green-900/30 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre-wrap custom-scrollbar">
                                {expectedAnswer}
                            </div>
                        </div>
                    </div>
                    <ExplanationReveal explanation={explanation} unitId={unitId} />
                </div>
            )}
        </div>
    );
}
