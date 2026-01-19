import { generateText, Output } from 'ai';
import { z } from 'zod';
import { ContentRepository } from '@/features/library/repositories/content.repository';
import { ResultSchema, Question } from '@/features/library/schemas/question-generator';
import { ratelimit } from '@/lib/ratelimit';
import { findRelatedChunks } from '@/features/library/services/retrieval-service';
import {
    ProcessingOptions,
    GRANULARITY_PROMPTS,
} from '@/features/library/schemas/processing-options';
import {
    QuestionGenerationOptions,
    TYPE_LABELS,
} from '@/features/library/schemas/question-options';
import { BANCA_PROFILES } from '@/features/library/schemas/banca-profiles';
import { AI_MODELS } from '@/features/library/config/ai-models';

/**
 * Service to handle AI generation tasks.
 */

/**
 * Heuristic to remove Table of Contents lines.
 * Detects patterns like: "Title ............ 12" or "Title       12"
 */
function cleanTableOfContents(text: string): string {
    return text
        .split('\n')
        .filter(line => {
            // Reject lines ending in multiple dots and a number (Standard PDF ToC)
            // e.g. "Capítulo 1 ................... 5"
            if (/\.{3,}\s*\d+$/.test(line)) return false;

            // Reject lines that are just labeled "Sumário" or "Índice"
            if (/^(sumário|índice|table of contents)$/i.test(line.trim())) return false;

            // Reject lines that are mostly dots
            if ((line.match(/\./g) || []).length > 10) return false;

            return true;
        })
        .join('\n');
}

export async function analyzeContent(
    userId: string,
    sourceId: string,
    options: ProcessingOptions = { granularity: 'DETAILED', model: AI_MODELS.CHEAP }
): Promise<{ output: any; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string }> {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    // 1. Fetch the raw content via Repository
    const source = await ContentRepository.findSourceById(sourceId, userId);

    if (!source || !source.bodyText) {
        throw new Error('Source not found or empty');
    }

    const cleanText = cleanTableOfContents(source.bodyText);

    // 2. Call AI SDK
    const { model } = options;
    const { output, usage } = await generateText({
        model: model || AI_MODELS.CHEAP, // Fallback purely for safety
        output: Output.object({
            schema: z.object({
                suggestedSubject: z.string().describe("O assunto principal (e.g. 'Constitutional Law', 'React Architecture')"),
                suggestedTopics: z.array(z.string()).describe("5-10 tags de alto nível"),
                units: z.array(z.object({
                    title: z.string().describe("O Titulo da Sessão de Estudo (e.g. 'Fundamental Rights', 'Server Components')"),
                    description: z.string().describe("Um resumo denso, rica em palavras-chave, de o que esta unidade cobre. Usado para contexto de busca vetorial."),
                    type: z.enum(['TEXT', 'CODE']),
                    // Optional: You can add 'pageStart' or 'citation' if you want to be fancy later
                }))
            }),
        }),
        prompt: `
            Você é um Arquiteto de Estudo Estratégico.
            ${GRANULARITY_PROMPTS[options.granularity]}
            ${options.focus ? `USER FOCUS CONSTRAINT: "${options.focus}"` : ''}

            Sua meta é converter este documento bruto em um **Plano de Estudo Estruturado**.

            INSTRUÇÃO CRÍTICA: EVITE "INDEX SINDROME"
            - O início dos documentos muitas vezes contém Sumários, Índices, ou definições curtas. **Não crie unidades separadas para esses itens.**
            - em vez disso, **AGRUPE** esses pequenos pedaços em grupos temáticos maiores.
            
            ESTRATEGIA: "CLUSTERING SEMANTICO"
            1. **Análise do texto completo** para entender os "Arcos Maiores".
            2. **Agrupamento por Tema:**
            - **Direito:** Não liste "Art 1", "Art 2". Agrupe-os em "Principios do Estado (Arts 1-4)".
            - **Código:** Não liste "Button.tsx", "Input.tsx". Agrupe-os em "Componentes UI".
            - **História:** Não liste "1914", "1915". Agrupe-os em "Guerra Mundial I (1914-1916)".
            3. **Ignorar Metadados:** Ignore preambulos, copyright notices, ou paginas de sumarios, exceto se contenham material de estudo.

            OUTPUT REGRAS:
            - **Title:** Descritivo e Profissional. (Se Lei, inclua o Artigo: "Tema (Arts. X-Y)").
            - **Description (CRITICAL):** Escreva um resumo curto (até 200 caracteres), rica em palavras-chave, de o que esta unidade cobre. 
              *Ruim:* "Esta unidade fala sobre Artigo 5."
              *Bom:* "Cobre direitos individuais, habeas corpus, direitos de propriedade, e a inviolabilidade da casa."

            TEXT PARA ANALISAR:
            ${cleanText}
        `,
    });

    if (!output?.units) {
        throw new Error('AI failed to generate valid units');
    }

    return {
        output,
        usage: {
            promptTokens: usage?.inputTokens ?? 0,
            completionTokens: usage?.outputTokens ?? 0,
            totalTokens: usage?.totalTokens ?? 0
        },
        model
    };
}

export async function generateQuestions(
    userId: string,
    unitId: string,
    unitContent: string,
    unitType: 'TEXT' | 'CODE',
    options: QuestionGenerationOptions = { count: '5', types: ['MULTIPLE_CHOICE', 'OPEN', 'CODE'], banca: 'STANDARD', model: AI_MODELS.CHEAP }
): Promise<{ questions: Question[]; usage: { promptTokens: number; completionTokens: number; totalTokens: number }; model: string }> {
    const { success } = await ratelimit.limit(userId);
    if (!success) {
        throw new Error("Rate limit exceeded. Try again later.");
    }

    // Fetch Unit Context from Repository
    const unit = await ContentRepository.findUnitWithContext(unitId);

    if (!unit) {
        throw new Error("Unit not found");
    }

    // Security check enforced
    if (unit.source.userId !== userId) {
        throw new Error("Unauthorized");
    }

    const searchQuery = `${unit.content}: ${unit.description || ''}`;

    const relatedChunks = await findRelatedChunks(searchQuery, 10, unit.sourceId);


    const reRankedChunks = await reRankChunks(searchQuery, relatedChunks);

    // Format the context for the Prompt
    const evidenceBlock = reRankedChunks.map((chunk, i) => `
    [SOURCE REF: ${chunk.pageNumber}]
    "${chunk.content}"
    `).join('\n\n');

    const subjectName = unit.source.subject?.name || "General Knowledge";
    const topicNames = unit.source.topics.map(t => t.name).join(", ");

    // Build dynamic prompt parts from options
    const typeInstructions = options.types.map(t => TYPE_LABELS[t]).join(', ');
    const scopeInstruction = options.scope ? `\n            SCOPE CONSTRAINT: "${options.scope}"` : '';
    const bancaProfile = BANCA_PROFILES[options.banca];

    const { output, usage } = await generateText({
        model: options.model || AI_MODELS.CHEAP, // Fallback purely for safety
        output: Output.object({ schema: ResultSchema }),
        prompt: `
            ${bancaProfile}

            Gere exatamente ${options.count} questões para o conceito: "${unit.content}".
            ${scopeInstruction}

            TIPOS DE QUESTÕES PARA INCLUIR: ${typeInstructions}
            Distribua as questões entre estes tipos de forma equânime.

            MATERIAL DE REFERENCIA (A verdadeira):
            ${evidenceBlock}

            INSTRUÇÕES CRÍTICAS DE OUTPUT:
            1.  **Idioma:** Todo o conteúdo (enunciado, opções, explicação) deve estar em PORTUGUÊS DO BRASIL (pt-BR) culto.
            2.  **Fidelidade:** Baseie-se APENAS no Material Fonte fornecido.
            3.  **Referencia:** Não coloque a referência do texto fonte no enunciado.

            INSTRUCAO CRITICA - CITACOES:
            - **Primaria:** Se o texto menciona uma Lei/Artigo (ex: "Art. 5º", "Inciso II"), cite ELE. É mais valioso que o numero da pagina.
              Exemplo: (Ref: Art. 6º, Caput)
            - **Secundaria:** Se nenhum Artigo especifico for mencionado, use o numero da pagina fornecido em [SOURCE_REF].
              Exemplo: (Ref: Page 12)

            INSTRUCAO CRITICA - VARIETADE:
            - NÃO se concentre em um único Artigo (ex: não crie ${options.count} questões sobre Art. 6).
            - Procure por regras ou sub-topicos diferentes nos chunks fornecidos e espalhe suas questões.
        `,
    });

    if (!output?.questions) {
        throw new Error("Failed to generate structure");
    }

    // Return questions with default topics mapped to their names if not generated
    const questionsWithTopics = output.questions.map(q => ({
        ...q,
        topics: q.topics && q.topics.length > 0 ? q.topics : unit.source.topics.map(t => t.name)
    }));

    return {
        questions: questionsWithTopics,
        usage: {
            promptTokens: usage?.inputTokens ?? 0,
            completionTokens: usage?.outputTokens ?? 0,
            totalTokens: usage?.totalTokens ?? 0
        },
        model: options.model
    };
}

async function reRankChunks(query: string, chunks: any[]) {
    if (chunks.length <= 3) return chunks;

    const { output } = await generateText({
        model: AI_MODELS.CHEAP,
        output: Output.object({
            schema: z.object({
                relevantChunkIds: z.array(z.string())
            })
        }),
        prompt: `
        Você é um Filtro de Relevância.
        Query: "${query}"

        Abaixo estão os segmentos recuperados de um documento.
        Retorne os IDs dos segmentos que contenham diretamente a resposta ou regras relevantes.
        Descarte segmentos que são apenas relacionados de forma tangencial.

        Segmentos:
        ${chunks.map(c => `[ID: ${c.id}] ${c.content.substring(0, 150)}...`).join('\n')}
        `
    });

    // Filter the original full list based on AI's selection
    return chunks.filter(c => output.relevantChunkIds.includes(c.id));
}
