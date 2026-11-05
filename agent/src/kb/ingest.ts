import { chunkText } from "./chunk"
import { addChunksToStore } from "./store"



export type IngestTextInput = {
    text: string
    source?: string
}


export async function ingestText(input: IngestTextInput) {
    if (!input || typeof input.text !== "string") {
        throw new Error('Invalid input')
    }

    const raw = input.text.trim()
    if (!raw) {
        throw new Error("No text to ingest")
    }

    const source = input?.source?.trim() || "pasted-text"

    const docs = await chunkText(raw, source)

    if (docs.length === 0) {
        throw new Error("Text processing produces no chunk")
    }

    const chunkCount = await addChunksToStore(docs)

    return {
        docCount: 1,
        chunkCount,
        source
    }
} 