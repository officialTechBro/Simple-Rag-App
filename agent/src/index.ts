import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import { env } from './shared/env';
import { kbRouter } from './routes/rag.routes';

const app = express();

// Middleware
app.use(cors({
    origin: env.ALLOWED_ORIGIN
}));

app.use(express.json({
    limit: '1mb'
}));

// Health check
app.get('/health', (_req, res) => {
    res.status(200).json({
        ok: true,
        message: 'API is running'
    });
});

// Routes
app.use('/kb', kbRouter);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        ok: false,
        error: 'Route not found'
    });
});

// Start server
const port = env.PORT;

app.listen(port, () => {
    console.log(`Server is now running on port: ${port}`);
});