import {z} from 'zod'


const EnvSchema = z.object({
    PORT: z.string().default('7700'),
    ALLOWED_ORIGIN: z.url().default("http://localhost:3000"),
    MODEL_PROVIDER: z.enum(['openai', 'gemini', 'groq']).default('groq'),
    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    OPENAI_MODEL: z.string().default('gpt-4o-mini'),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    GROQ_MODEL: z.string().default('openai/gpt-oss-20b'),
    SEARCHPROVIDER: z.string().default("tavily"),
    TAVILY_API_KEY: z.string().optional(),
    RAG_MODE_PROVIDER: z.string().default("gemini")
})

export const env = EnvSchema.parse(process.env)