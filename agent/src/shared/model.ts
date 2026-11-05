import {BaseChatModel} from "@langchain/core/language_models/chat_models";
import {ChatGoogleGenerativeAI} from "@langchain/google-genai"
import {ChatGroq} from "@langchain/groq"
import {ChatOpenAI} from "@langchain/openai"

import { env } from "./env";

type ModelParam = {
    temperature?: number
    maxToken?: number
}


export function getChatModel(opts: ModelParam = {}): BaseChatModel {
    const temp = opts?.temperature ?? 0.2
    const token = opts?.maxToken
    const common = {maxRetries: 3, timeout: 30000}

    switch(env.MODEL_PROVIDER) {
        case "gemini":
            return new ChatGoogleGenerativeAI({
                apiKey: env.GOOGLE_API_KEY,
                model: env.GEMINI_MODEL,
                temperature: temp,
                maxOutputTokens: token,
                maxRetries: common.maxRetries
            })
        case "groq":
            return new ChatGroq({
                apiKey: env.GROQ_API_KEY,
                model: env.GROQ_MODEL,
                temperature: temp,
                maxTokens: token,
                ...common
            })
        case "openai":
            return new ChatOpenAI({
                apiKey: env.OPENAI_API_KEY,
                model: env.OPENAI_MODEL,
                temperature: temp,
            })

        default:
            throw new Error(`Unsupported model-provider ${env.MODEL_PROVIDER}`)
    }
}