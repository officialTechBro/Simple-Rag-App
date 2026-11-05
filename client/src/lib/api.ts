const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7700";

export type IngestResult = {
  docCount: number;
  chunkCount: number;
  source: string;
};

export type KBSource = { source: string; chunkId: number };

export type AskResult = {
  answer: string;
  sources: KBSource[];
  confidence: number;
};

async function post<T>(path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  } catch {
    throw new Error(`Cannot reach the API at ${API_URL}. Is the agent running?`);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const detail = data?.details?.[0]?.message;
    throw new Error(detail ?? data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const ingest = (text: string, source?: string) =>
  post<IngestResult>("/kb/ingest", { text, ...(source ? { source } : {}) });

export const ask = (query: string, k?: number) =>
  post<AskResult>("/kb/ask", { query, ...(k ? { k } : {}) });

export const resetKB = () => post<{ cleared: boolean }>("/kb/reset");
