import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';
import authRouter from './routes/auth.js';
import availabilityRouter from './routes/availability.js';
import bookingRouter from './routes/booking.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/api', availabilityRouter);
app.use('/api', bookingRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Local dev: init DB and start listening
// Vercel: api/index.js handles this instead
if (!process.env.VERCEL) {
  const port = process.env.PORT || 3000;
  const start = async () => {
    if (process.env.POSTGRES_URL) {
      await initDb();
      console.log('Database initialized');
    } else {
      console.log('No POSTGRES_URL — skipping database, running API only');
    }
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  };
  start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
  });
}

export default app;
