import 'dotenv/config';
import { initDb } from '../db.js';
import app from '../index.js';

// Ensure tables exist on first cold start
let dbReady = false;

export default async function handler(req, res) {
  if (!dbReady) {
    await initDb();
    dbReady = true;
  }
  return app(req, res);
}
