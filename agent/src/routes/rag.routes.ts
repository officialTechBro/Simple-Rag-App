
import { Router } from "express";
import { z, ZodError } from "zod";

import { ingestText } from "../kb/ingest";
import { askKB } from "../kb/ask";
import { resetStore } from "../kb/store";

export const kbRouter = Router();

// Request validation schemas
const IngestBody = z.object({
    text: z.string().trim().min(1, "Provide some text to ingest").max(100_000, "Text is too large"),

    source: z.string().trim().min(1).optional()
});

const AskBody = z.object({
    query: z.string().trim().min(3, "Please ask a complete query"),

    k: z.number().int().min(1).max(10).optional()
});

// INGEST
kbRouter.post("/ingest", async (req, res) => {
    try {
        const body = IngestBody.parse(req.body);

        const result = await ingestText({
            text: body.text,
            source: body.source ?? "pasted-text"
        });

        return res.status(200).json({
            ok: true,
            ...result
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                ok: false,
                error: "Invalid request body",
                details: error.issues
            });
        }

        console.error("KB ingestion failed:", error);

        return res.status(500).json({
            ok: false,
            error: "Failed to ingest document"
        });
    }
});

// RESET
kbRouter.post("/reset", (_req, res) => {
    resetStore();

    return res.status(200).json({
        ok: true,
        cleared: true
    });
});

// ASK
kbRouter.post("/ask", async (req, res) => {
    try {
        const body = AskBody.parse(req.body);

        const result = await askKB(
            body.query,
            body.k
        );

        return res.status(200).json({
            ok: true,
            answer: result.answer,
            sources: result.sources,
            confidence: result.confidence
        });

    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                ok: false,
                error: "Invalid request body",
                details: error.issues
            });
        }

        console.error("KB question failed:", error);

        return res.status(500).json({
            ok: false,
            error: "Failed to process question"
        });
    }
});
