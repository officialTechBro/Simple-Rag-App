import { Document } from "@langchain/core/documents"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"


const CHUNK_SIZE=1000
const CHUNK_OVERLAP=150

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ["\n\n", "\n", ". ", " ", ""]
})


export async function chunkText(text: string, source: string): Promise<Document[]> {
    const normalizeText = (text ?? "").replace(/\r\n/g, "\n").trim()
    if (!normalizeText) return []

    const docs = await splitter.createDocuments(
        [normalizeText],
        [{source}]
    )

    return docs.map((doc, chunkId) => {
        doc.metadata.chunkId = chunkId
        return doc
    })
}