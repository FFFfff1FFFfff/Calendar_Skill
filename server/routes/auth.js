import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { getAuthUrl, exchangeCode } from '../lib/nylas.js';

const router = Router();

// Redirect to Nylas hosted auth
router.get('/google', (req, res) => {
  const ownerId = req.query.owner_id;
  if (!ownerId) return res.status(400).json({ error: 'owner_id is required' });

  const authUrl = getAuthUrl(ownerId);
  res.redirect(authUrl);
});

// Handle Nylas callback
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state: ownerId } = req.query;
    if (!code) return res.status(400).json({ error: 'Missing authorization code' });

    const tokenResponse = await exchangeCode(code);
    const grantId = tokenResponse.grantId;
    const email = tokenResponse.email || '';

    // Upsert calendar connection
    db.prepare(`
      INSERT INTO calendar_connections (id, owner_id, nylas_grant_id, google_email)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(owner_id) DO UPDATE SET
        nylas_grant_id = excluded.nylas_grant_id,
        google_email = excluded.google_email,
        connected_at = datetime('now'),
        is_valid = 1
    `).run(uuid(), ownerId, grantId, email);

    res.json({ success: true, owner_id: ownerId, email });
  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
