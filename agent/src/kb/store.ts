import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"
import { env } from "../shared/env"
import { OpenAIEmbeddings } from "@langchain/openai"
import {MemoryVectorStore} from "@langchain/classic/vectorstores/memory"
import { Document } from "@langchain/core/documents"


type Provider = "google" | "openai"

function getRagProvider(): Provider {
    const value = (env.RAG_MODE_PROVIDER).toLowerCase()

    if (value === "gemini" || value === "google") {
        return "google"
    } 

    if (value === "openai") {
        return "openai"
    } 

    throw new Error(`Unsupported RAG provider - ${value}`)
}


function makeGoogleEmbeddings() {
    const key = env.GOOGLE_API_KEY ?? ""
    if (!key) {
        throw new Error('Google API KEY missing')
    }

    return new GoogleGenerativeAIEmbeddings({
        apiKey: key,
        model: "gemini-embedding-001"
    })
}


function makeOpenaiEmbeddings() {
    const key = env.OPENAI_API_KEY ?? ""
    if (!key) {
        throw new Error('Openai API KEY missing')
    }

    return new OpenAIEmbeddings({
        apiKey: key,
        model: "text-embedding-3-small"
    })
}


function makeEmbeddings(provider: Provider) {
    return provider === "google"
        ? makeGoogleEmbeddings()
        : makeOpenaiEmbeddings()
}


let store: MemoryVectorStore | null = null
let currentProvider: Provider | null = null

export function getVectorStore(): MemoryVectorStore {
    const provider = getRagProvider()

    if (store && currentProvider === provider) {
        return store
    }

    store = new MemoryVectorStore(makeEmbeddings(provider))
    currentProvider = provider
    return store
}

export async function addChunksToStore(docs: Document[]): Promise<number> {
    if (!Array.isArray(docs) || docs.length === 0) return 0

    const store = getVectorStore()
    await store.addDocuments(docs)

    return docs.length
}


export function resetStore() {
    store = null
    currentProvider = null
}