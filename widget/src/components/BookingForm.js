/**
 * Booking form — collects customer name, email, and optional notes.
 */
export function BookingForm(container, { onSubmit }) {
  container.innerHTML = `
    <form class="cb-form">
      <label>Name
        <input type="text" name="name" required />
      </label>
      <label>Email
        <input type="email" name="email" required />
      </label>
      <label>Notes (optional)
        <textarea name="notes" rows="2"></textarea>
      </label>
      <button type="submit">Confirm Booking</button>
    </form>
  `;

  const form = container.querySelector('form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    onSubmit({
      customerName: data.get('name'),
      customerEmail: data.get('email'),
      notes: data.get('notes'),
    });
  });
}
