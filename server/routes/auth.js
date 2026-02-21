import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { sql } from '../db.js';
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

    console.log('Auth success:', { ownerId, grantId, email });

    // Save to DB if available
    if (process.env.POSTGRES_URL) {
      const id = uuid();
      await sql`
        INSERT INTO calendar_connections (id, owner_id, nylas_grant_id, google_email)
        VALUES (${id}, ${ownerId}, ${grantId}, ${email})
        ON CONFLICT(owner_id) DO UPDATE SET
          nylas_grant_id = EXCLUDED.nylas_grant_id,
          google_email = EXCLUDED.google_email,
          connected_at = NOW(),
          is_valid = true
      `;
    }

    res.json({ success: true, owner_id: ownerId, grant_id: grantId, email });
  } catch (err) {
    console.error('Auth callback error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

export default router;
