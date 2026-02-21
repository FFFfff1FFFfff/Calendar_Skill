import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { getFreeBusy, createEvent } from '../lib/nylas.js';

const router = Router();

router.post('/book', async (req, res) => {
  try {
    const { owner_id, customer_name, customer_email, start_time, end_time, notes } = req.body;

    if (!owner_id || !customer_name || !customer_email || !start_time || !end_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get calendar connection
    const conn = db.prepare(
      'SELECT nylas_grant_id, google_email FROM calendar_connections WHERE owner_id = ? AND is_valid = 1'
    ).get(owner_id);
    if (!conn) {
      return res.status(404).json({ error: 'No calendar connected for this owner' });
    }

    // Recheck free/busy to prevent double booking
    const freeBusyData = await getFreeBusy(
      conn.nylas_grant_id,
      conn.google_email,
      start_time,
      end_time
    );

    const isBusy = freeBusyData.some(entry =>
      entry.timeSlots?.some(slot =>
        slot.startTime < end_time && slot.endTime > start_time
      )
    );

    if (isBusy) {
      return res.status(409).json({ error: 'Time slot is no longer available' });
    }

    // Create event on Google Calendar via Nylas
    const event = await createEvent(conn.nylas_grant_id, {
      title: `Booking: ${customer_name}`,
      startTime: start_time,
      endTime: end_time,
      participants: [{ name: customer_name, email: customer_email }],
      description: notes || '',
    });

    // Save booking locally
    const bookingId = uuid();
    db.prepare(`
      INSERT INTO bookings (id, owner_id, customer_name, customer_email, start_time, end_time, notes, nylas_event_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, owner_id, customer_name, customer_email, start_time, end_time, notes || '', event.id || '');

    res.json({
      success: true,
      booking_id: bookingId,
      event_id: event.id,
    });
  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

export default router;
