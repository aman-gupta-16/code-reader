import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';

const app = express();
const port = Number(process.env.PORT ?? 5000);
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI must be configured.');
}

const uploadsDir = path.resolve(process.cwd(), 'uploads');
await fs.mkdir(uploadsDir, { recursive: true });

app.use(
  cors({
    origin: process.env.CLIENT_APP_URL?.split(',').map((item) => item.trim()) ?? 'http://localhost:5173',
    credentials: false,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'client-review-panel-api' });
});

app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);

app.use((error, _req, res, _next) => {
  const status = Number(error.statusCode ?? 500);
  const message = error.message || 'Unexpected server error.';

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({ message });
});

await connectDatabase(mongoUri);
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
