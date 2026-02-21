import { Router } from 'express';
import db from '../db.js';
import { getFreeBusy } from '../lib/nylas.js';
import { computeAvailableSlots } from '../lib/slots.js';

const router = Router();

router.get('/availability', async (req, res) => {
  try {
    const { owner_id, date } = req.query;
    if (!owner_id || !date) {
      return res.status(400).json({ error: 'owner_id and date are required' });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'date must be YYYY-MM-DD' });
    }

    // Get calendar connection
    const conn = db.prepare(
      'SELECT nylas_grant_id, google_email FROM calendar_connections WHERE owner_id = ? AND is_valid = 1'
    ).get(owner_id);
    if (!conn) {
      return res.status(404).json({ error: 'No calendar connected for this owner' });
    }

    // Get business hours for the day of week
    const dayOfWeek = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7; // 0=Mon
    const hours = db.prepare(
      'SELECT * FROM business_hours WHERE owner_id = ? AND day_of_week = ?'
    ).get(owner_id, dayOfWeek);
    if (!hours) {
      return res.json({ date, slots: [], message: 'Closed on this day' });
    }

    // Query Nylas free/busy for the full day in owner's timezone
    const timezone = hours.timezone || 'America/New_York';
    const startOfDay = Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000) - 86400; // buffer
    const endOfDay = startOfDay + 86400 * 3; // buffer

    const freeBusyData = await getFreeBusy(
      conn.nylas_grant_id,
      conn.google_email,
      startOfDay,
      endOfDay
    );

    // Extract busy blocks from response
    const busyBlocks = [];
    for (const entry of freeBusyData) {
      if (entry.timeSlots) {
        for (const slot of entry.timeSlots) {
          busyBlocks.push({
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }
    }

    const availableSlots = computeAvailableSlots(hours, busyBlocks, date, timezone);

    res.json({
      date,
      timezone,
      slots: availableSlots,
    });
  } catch (err) {
    console.error('Availability error:', err);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

export default router;
