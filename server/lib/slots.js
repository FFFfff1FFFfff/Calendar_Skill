/**
 * Given business hours and busy blocks, compute available time slots.
 *
 * @param {Object} hours - { start_time: "09:00", end_time: "17:00", slot_duration_minutes: 60 }
 * @param {Array} busyBlocks - [{ startTime: unix, endTime: unix }, ...]
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} timezone - IANA timezone string
 * @returns {Array} - [{ startTime: unix, endTime: unix }, ...]
 */
export function computeAvailableSlots(hours, busyBlocks, dateStr, timezone) {
  const slotDuration = (hours.slot_duration_minutes || 60) * 60;

  const dayStart = localToUnix(dateStr, hours.start_time, timezone);
  const dayEnd = localToUnix(dateStr, hours.end_time, timezone);

  const allSlots = [];
  for (let t = dayStart; t + slotDuration <= dayEnd; t += slotDuration) {
    allSlots.push({ startTime: t, endTime: t + slotDuration });
  }

  return allSlots.filter(slot =>
    !busyBlocks.some(busy => slot.startTime < busy.endTime && slot.endTime > busy.startTime)
  );
}

/**
 * Convert "YYYY-MM-DD" + "HH:MM" in a timezone to a unix timestamp (seconds).
 * Uses Intl.DateTimeFormat to resolve the timezone offset without external deps.
 */
function localToUnix(dateStr, timeStr, timezone) {
  const target = `${dateStr}T${timeStr}:00`;

  // Start with a guess: interpret target as UTC
  const guessMs = new Date(target + 'Z').getTime();

  // See what local time that guess maps to in the target timezone
  const guessLocal = formatInTz(new Date(guessMs), timezone);

  // Difference tells us the approximate offset
  const diffMs = new Date(target + 'Z').getTime() - new Date(guessLocal + 'Z').getTime();
  const correctedMs = guessMs + diffMs;

  // Second pass to handle DST boundaries
  const checkLocal = formatInTz(new Date(correctedMs), timezone);
  if (checkLocal !== target) {
    const diffMs2 = new Date(target + 'Z').getTime() - new Date(checkLocal + 'Z').getTime();
    return Math.floor((correctedMs + diffMs2) / 1000);
  }

  return Math.floor(correctedMs / 1000);
}

function formatInTz(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find(p => p.type === type)?.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}
