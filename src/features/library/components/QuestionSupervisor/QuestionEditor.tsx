import { Question } from '@/features/library/schemas/question-generator';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { Plus, X } from 'lucide-react';

interface QuestionEditorProps {
    question: Question;
    onUpdate: (q: Question) => void;
    errors?: Record<string, string>;
}

export function QuestionEditor({ question, onUpdate, errors }: QuestionEditorProps) {
    const handleChange = (field: keyof Question, value: any) => {
        onUpdate({ ...question, [field]: value });
    };

    const getError = (field: string) => errors?.[field];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            {/* Top Controls */}
            <div className="flex gap-4 items-start">
                <div className="w-1/3">
                    <label htmlFor="question-type" className="text-xs text-zinc-500 font-mono uppercase block mb-1.5 flex justify-between">
                        Question Type
                        {getError('type') && <span className="text-red-400">{getError('type')}</span>}
                    </label>
                    <select
                        id="question-type"
                        value={question.type}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 text-sm rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
                    >
                        <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                        <option value="OPEN">Open Ended</option>
                        <option value="CODE">Code Snippet</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs text-zinc-500 font-mono uppercase block mb-1.5">Topics</label>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-2 min-h-[42px] flex flex-wrap gap-2 items-center">
                        {(question.topics || []).map((topic, i) => (
                            <Badge
                                key={i}
                                variant="secondary"
                                className="bg-zinc-800 text-zinc-300 border-zinc-700 h-6 px-2 gap-1"
                            >
                                {topic}
                                <button
                                    onClick={() => {
                                        const newTopics = (question.topics || []).filter((_, idx) => idx !== i);
                                        handleChange('topics', newTopics);
                                    }}
                                    className="text-zinc-500 hover:text-red-400 focus:outline-none"
                                    aria-label={`Remove topic ${topic}`}
                                >
                                    <X size={10} />
                                </button>
                            </Badge>
                        ))}
                        <input
                            aria-label="Add topic"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = e.currentTarget.value.trim();
                                    if (val) {
                                        const current = question.topics || [];
                                        if (!current.includes(val)) {
                                            handleChange('topics', [...current, val]);
                                        }
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                            className="bg-transparent text-sm text-zinc-300 focus:outline-none min-w-[120px] placeholder:text-zinc-700"
                            placeholder="Add topic..."
                        />
                    </div>
                </div>
            </div>

            {/* Question Text */}
            <div>
                <label htmlFor="question-prompt" className="text-xs text-zinc-500 font-mono uppercase block mb-1.5 flex justify-between">
                    Question Prompt
                    {getError('questionText') && <span className="text-red-400 font-bold">{getError('questionText')}</span>}
                </label>
                <textarea
                    id="question-prompt"
                    value={question.questionText}
                    onChange={(e) => handleChange('questionText', e.target.value)}
                    className={`w-full bg-zinc-900/50 border rounded-lg p-4 text-base text-zinc-100 focus:ring-1 outline-none min-h-[120px] font-medium resize-y ${getError('questionText')
                        ? 'border-red-900/50 focus:border-red-500/50 focus:ring-red-500/20'
                        : 'border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/50'
                        }`}
                    placeholder="Enter the question prompt here..."
                />
            </div>

            {/* Dynamic Content Area */}
            <div className={`bg-zinc-900/30 border rounded-lg p-5 space-y-5 ${getError('correctAnswer') ? 'border-red-900/30' : 'border-zinc-800/50'}`}>
                {question.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-zinc-500 font-mono uppercase flex items-center gap-2">
                                Options
                                {getError('correctAnswer') && <span className="text-red-400 normal-case">- {getError('correctAnswer')}</span>}
                            </label>
                            <span className="text-[10px] text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">Check to mark correct</span>
                        </div>
                        <div className="space-y-2">
                            {(question.options || []).map((opt, i) => {
                                const isCorrect = question.correctAnswer === opt;
                                return (
                                    <div key={i} className={`flex gap-3 items-center group transition-all ${isCorrect ? 'opacity-100' : 'opacity-80'}`}>
                                        <button
                                            onClick={() => handleChange('correctAnswer', opt)}
                                            className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isCorrect
                                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-500'
                                                : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'
                                                }`}
                                            role="radio"
                                            aria-checked={isCorrect}
                                            aria-label="Mark as correct"
                                        >
                                            {isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                                        </button>
                                        <div className="flex-1 relative">
                                            <input
                                                value={opt}
                                                onChange={(e) => {
                                                    const newOptions = [...(question.options || [])];
                                                    newOptions[i] = e.target.value;
                                                    handleChange('options', newOptions);
                                                    if (isCorrect) handleChange('correctAnswer', e.target.value);
                                                }}
                                                className={`w-full bg-zinc-950 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 ${isCorrect
                                                    ? 'border-emerald-900/50 text-emerald-100 focus:border-emerald-500/50 focus:ring-emerald-500/20'
                                                    : 'border-zinc-800 text-zinc-300 focus:border-indigo-500/50 focus:ring-indigo-500/20'
                                                    }`}
                                                placeholder={`Option ${i + 1}`}
                                                aria-label={`Option ${i + 1}`}
                                            />
                                            <button
                                                onClick={() => {
                                                    const newOptions = (question.options || []).filter((_, idx) => idx !== i);
                                                    handleChange('options', newOptions);
                                                }}
                                                className="absolute right-2 top-2.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                aria-label="Remove option"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChange('options', [...(question.options || []), ''])}
                                className="w-full border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 hover:border-zinc-700 mt-2"
                            >
                                <Plus size={14} className="mr-2" /> Add Option
                            </Button>
                        </div>
                    </div>
                )}

                {(question.type === 'OPEN' || question.type === 'CODE') && (
                    <div>
                        <label htmlFor="model-answer" className="text-xs text-zinc-500 font-mono uppercase block mb-1.5 flex justify-between">
                            Model Answer
                            {getError('correctAnswer') && <span className="text-red-400">{getError('correctAnswer')}</span>}
                        </label>
                        <textarea
                            id="model-answer"
                            value={question.correctAnswer}
                            onChange={(e) => handleChange('correctAnswer', e.target.value)}
                            className={`w-full bg-zinc-950 border rounded-lg p-4 text-sm text-zinc-300 focus:ring-1 outline-none min-h-[120px] font-mono ${getError('correctAnswer')
                                ? 'border-red-900/50 focus:border-red-500/50 focus:ring-red-500/20'
                                : 'border-zinc-800 focus:border-indigo-500/50 focus:ring-indigo-500/50'
                                }`}
                            placeholder="Enter the expected answer or output..."
                        />
                    </div>
                )}
            </div>

            {/* Explanation */}
            <div>
                <label htmlFor="explanation" className="text-xs text-zinc-500 font-mono uppercase block mb-1.5 flex justify-between">
                    Explanation
                </label>
                <textarea
                    id="explanation"
                    value={question.explanation}
                    onChange={(e) => handleChange('explanation', e.target.value)}
                    className="w-full bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-400 focus:border-zinc-700 outline-none min-h-[80px]"
                    placeholder="Explain the reasoning behind the correct answer..."
                />
            </div>
        </div>
    );
}
