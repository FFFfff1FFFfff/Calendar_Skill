/**
 * API client for the booking server.
 * Base URL is set when the widget is initialized.
 */
let baseUrl = '';

export function setBaseUrl(url) {
  baseUrl = url.replace(/\/$/, '');
}

export async function fetchAvailability(ownerId, date) {
  const res = await fetch(`${baseUrl}/api/availability?owner_id=${ownerId}&date=${date}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch availability');
  }
  return res.json();
}

export async function createBooking({ ownerId, customerName, customerEmail, startTime, endTime, notes }) {
  const res = await fetch(`${baseUrl}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner_id: ownerId,
      customer_name: customerName,
      customer_email: customerEmail,
      start_time: startTime,
      end_time: endTime,
      notes,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to create booking');
  }
  return res.json();
}
