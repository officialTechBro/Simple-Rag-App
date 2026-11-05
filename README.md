# Simple RAG

A small Retrieval-Augmented Generation (RAG) app. Paste text into an in-memory knowledge base, then chat with it. Answers are generated only from the text you added, and each one lists the source chunks and a confidence score.

```
simple_rag/
├── agent/    Express + LangChain API (TypeScript)
└── client/   Next.js + shadcn/ui dark chat interface
```

## How it works

1. **Ingest:** text is split into 1,000-character chunks (150 overlap), embedded, and stored in an in-memory vector store.
2. **Ask:** the question is embedded, the top-k most similar chunks are retrieved (default 2, max 10), and a chat model answers using only that context.
3. **Respond:** the API returns the answer, the sources (`source` + `chunkId`), and a confidence value (the average similarity score of the retrieved chunks, 0–1).

> The vector store lives in server memory. **Everything is lost when the agent restarts**, and the "sources this session" list in the UI is kept only in the browser.

## Requirements

- Node.js 20+ (developed on 22)
- An API key for at least one chat provider **and** one embeddings provider (see below)

## Setup

### 1. Agent (API)

```bash
cd agent
npm install
```

Create `agent/.env`:

```env
PORT=8800
ALLOWED_ORIGIN=http://localhost:3000

# Chat model: gemini | groq | openai
MODEL_PROVIDER=groq
GROQ_API_KEY=...
# GOOGLE_API_KEY=...
# OPENAI_API_KEY=...

# Embeddings: gemini (or google) | openai
RAG_MODE_PROVIDER=gemini
```

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `7700` | API port |
| `ALLOWED_ORIGIN` | `http://localhost:3000` | CORS origin; must match the client URL |
| `MODEL_PROVIDER` | `groq` | `openai`, `gemini` or `groq` |
| `OPENAI_MODEL` | `gpt-4o-mini` | |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | |
| `RAG_MODE_PROVIDER` | `gemini` | Embeddings provider: `gemini`/`google` (`gemini-embedding-001`) or `openai` (`text-embedding-3-small`) |
| `OPENAI_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY` | — | Provide the keys for the providers you selected |
| `SEARCHPROVIDER`, `TAVILY_API_KEY` | `tavily` / — | Defined but not used yet |

Note that chat and embeddings are configured separately. For example, `MODEL_PROVIDER=groq` still needs a `GOOGLE_API_KEY` (or `OPENAI_API_KEY`) for embeddings, because Groq doesn't provide them here.

```bash
npm run dev     # tsx watch, http://localhost:8800
```

### 2. Client (UI)

```bash
cd client
npm install
```

Create `client/.env.local` (see `.env.example`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8800
```

This must match the agent's `PORT`.

```bash
npm run dev     # http://localhost:3000
```

Open http://localhost:3000, add some text in the left panel, and ask questions in the chat.

## API

Base URL: `http://localhost:<PORT>`. All bodies are JSON.

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `{ ok, message }` |
| `POST` | `/kb/ingest` | `{ text, source? }` (`text` ≤ 100,000 chars) | `{ ok, docCount, chunkCount, source }` |
| `POST` | `/kb/ask` | `{ query, k? }` (`query` ≥ 3 chars, `k` 1–10) | `{ ok, answer, sources, confidence }` |
| `POST` | `/kb/reset` | — | `{ ok, cleared }` |

Validation errors return `400` with `{ ok: false, error, details }`; other failures return `500`.

```bash
curl -X POST localhost:8800/kb/ingest \
  -H "Content-Type: application/json" \
  -d '{"text":"The office is closed on Fridays.","source":"handbook"}'

curl -X POST localhost:8800/kb/ask \
  -H "Content-Type: application/json" \
  -d '{"query":"When is the office closed?"}'
```

## Tech stack

- **Agent:** Express 5, LangChain (`@langchain/core`, `textsplitters`, `classic` `MemoryVectorStore`), Zod, tsx
- **Providers:** Google Gemini, Groq, OpenAI
- **Client:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui, Inter font, sonner toasts

## Project layout

```
agent/src/
├── index.ts               Express app, CORS, health check
├── routes/rag.routes.ts   /kb/ingest, /kb/ask, /kb/reset
├── kb/
│   ├── chunk.ts           Text splitting
│   ├── ingest.ts          Validate + chunk + store
│   ├── store.ts           Embeddings provider + in-memory vector store
│   └── ask.ts             Retrieval, prompt, confidence
└── shared/
    ├── env.ts             Env validation (Zod)
    └── model.ts           Chat model factory

client/src/
├── app/                   layout, page, global styles / theme tokens
├── components/
│   ├── chat.tsx           Chat conversation + composer
│   ├── knowledge-panel.tsx  Ingest form, sources list, reset
│   └── ui/                shadcn/ui components
└── lib/api.ts             Typed API client
```

## Limitations

- In-memory storage only: no persistence, and one shared knowledge base for all users.
- No authentication or rate limiting. Don't expose the agent publicly as-is.
- Text input only; no file upload.
- Answers are truncated to 1,500 characters.
