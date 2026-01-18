export const AI_MODELS = {
    CHEAP: 'gemini-2.5-flash-lite',
    // Fast model for heavy lifting (parsing, chunking, large context)
    FAST: 'gemini-2.0-flash',
    // High intelligence model for complex reasoning and creative generation
    INTELLIGENT: 'gemini-3.0-flash',
    EMBEDDING: 'multimodal-embedding-002'
} as const;

export type AiModelType = typeof AI_MODELS;
