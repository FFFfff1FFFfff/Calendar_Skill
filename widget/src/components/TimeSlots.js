/**
 * Renders available time slots as clickable buttons.
 */
export function TimeSlots(container, { slots, timezone, onSelect }) {
  if (!slots || slots.length === 0) {
    container.innerHTML = '<div class="cb-timeslots"><p>No available slots on this day.</p></div>';
    return;
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  });

  const buttons = slots.map(slot => {
    const start = formatter.format(new Date(slot.startTime * 1000));
    const end = formatter.format(new Date(slot.endTime * 1000));
    return `<button class="cb-slot" data-start="${slot.startTime}" data-end="${slot.endTime}">${start} – ${end}</button>`;
  }).join('');

  container.innerHTML = `
    <div class="cb-timeslots">
      <label>Available times</label>
      <div class="cb-slot-grid">${buttons}</div>
    </div>
  `;

  container.querySelectorAll('.cb-slot').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.cb-slot').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect({
        startTime: parseInt(btn.dataset.start),
        endTime: parseInt(btn.dataset.end),
      });
    });
  });
}
