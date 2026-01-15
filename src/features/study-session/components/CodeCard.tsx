'use client';

import { useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import { ExplanationReveal } from './ExplanationReveal';

interface CodeCardProps {
    question: string;
    initialCode?: string;
    expectedAnswer?: string;
    isFlipped: boolean;
    explanation?: string;
}

export function CodeCard({ question, initialCode = '', expectedAnswer = '', isFlipped, explanation }: CodeCardProps) {
    const [userCode, setUserCode] = useState(initialCode);

    return (
        <div className="w-full h-full flex flex-col space-y-6 animate-in fade-in duration-300">
            {/* Question Header */}
            <h3 className="text-xl md:text-2xl font-medium text-zinc-100 leading-tight">
                {question}
            </h3>

            {!isFlipped ? (
                /* FRONT: Input Area */
                <div className="w-full flex-1 flex flex-col min-h-[300px]"> {/* Added min-height */}
                    <label className="block text-xs uppercase tracking-wider text-green-400 mb-2 font-mono">
                        Terminal Input
                    </label>
                    <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950 shadow-inner focus-within:ring-1 focus-within:ring-green-900/50 focus-within:border-green-500/50 transition-all relative">
                        <div className="absolute inset-0 overflow-auto custom-scrollbar">
                            <Editor
                                value={userCode}
                                onValueChange={setUserCode}
                                highlight={code => Prism.highlight(code, Prism.languages.javascript, 'javascript')}
                                padding={16}
                                className="font-mono text-sm min-h-full"
                                style={{
                                    fontFamily: '"JetBrains Mono", monospace',
                                    fontSize: 14,
                                    backgroundColor: 'transparent',
                                    color: '#f8f8f2',
                                    minHeight: '100%'
                                }}
                                textareaClassName="focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            ) : (
                /* BACK: Comparison View */
                <div className="w-full h-full flex flex-col">
                    <div className="flex-1 grid grid-rows-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-zinc-500 font-mono">Your Solution</span>
                            <div className="w-full bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-sm text-zinc-300 overflow-x-auto whitespace-pre-wrap custom-scrollbar">
                                {userCode || <span className="text-zinc-700 italic">// No code provided</span>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-green-400 font-mono">Expected Answer</span>
                            <div className="w-full bg-zinc-950 p-3 rounded-lg border border-green-900/30 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre-wrap custom-scrollbar">
                                {expectedAnswer}
                            </div>
                        </div>
                    </div>
                    <ExplanationReveal explanation={explanation} />
                </div>
            )}
        </div>
    );
}
