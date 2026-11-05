import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getChatModel } from "../shared/model"
import { getVectorStore } from "./store"


export type KBSource = {
    source: string
    chunkId: number
}

export type KBAnswer = {
    answer: string
    sources: KBSource[]
    confidence: number
}

export type ContextChunk = {
    text: string
    source: string
    chunkId: number
}


const DEFAULT_K=2
const MAX_K=10
const MAX_ANSWER_LENGTH=1500

function normailzeK(k: number): number {
    if (!(Number.isFinite(k))) {
        return DEFAULT_K
    }

    return Math.min(Math.max(Math.floor(k), 1), MAX_K)
}

function buildContext(chunks: ContextChunk[]): string {
    return chunks.map(({text, source, chunkId}, index) => [
        `[Source #${index + 1}]`,
        `File: ${source}`,
        `Chunk: ${chunkId}`,
        `Content: \n${text.trim() || "Empty text"}`
    ].join("\n")).join("\n\n---\n\n")
}

async function buildAnswersFromLLM(query: string, context: string): Promise<string> {
    const model = getChatModel({temperature: 0.2})

    const response = await model.invoke([
        new SystemMessage(
            [
                "You are a helpful assistant that answers only using the provided context.",
                "If the answer is not found in the context, say so briefly.",
                "Be concise, neutral, and avoid marketing language.",
                "Do not fabricate sources or cite information that is not in the context.",
            ].join("\n")
        ),
        new HumanMessage(
            [
                `Question:\n${query}`,
                "",
                "Context:",
                context || "No relevant context was found.",
            ].join("\n")
        )
    ])

    const answer = typeof response.content === "string" ? response.content : String(response.content)

    return answer.trim().slice(0, MAX_ANSWER_LENGTH)
}

function buildResponseConfidence(scores: number[]): number {
    const validScores = scores.filter(Number.isFinite)
    if (validScores.length === 0) {
        return 0
    }

    const average = validScores.reduce((sum, score) => sum + score, 0) / validScores.length

    return Math.round(Math.max(0, Math.min(1, average)) * 100) / 100
}



export async function askKB(query: string, k = DEFAULT_K): Promise<KBAnswer> {
    const normalizeQuery = (query ?? "").trim()
    if (!normalizeQuery) {
        throw new Error("Query is empty. Please try again")
    }

    const topK = normailzeK(k)
    
    const store = getVectorStore()

    // convert user query to embedding
    const embeddedQuery = await store.embeddings.embedQuery(normalizeQuery)

    // find the most similar stored document
    const result = await store.similaritySearchVectorWithScore(embeddedQuery, topK)

    const chunks: ContextChunk[] = result.map(([doc]) => ({
        text: doc.pageContent ?? "",
        source: String(doc.metadata?.source ?? "unknown"),
        chunkId: Number(doc.metadata?.chunkId ?? 0)
    }))

    const scores = result.map(([, score]) => Number(score))

    const context = buildContext(chunks)

    const answer = await buildAnswersFromLLM(normalizeQuery, context)

    const sources: KBSource[] = chunks.map(({source, chunkId}) => ({
        source,
        chunkId
    }))

    const confidence = buildResponseConfidence(scores)

    return {
        answer,
        sources,
        confidence
    }
}

