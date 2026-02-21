/**
 * Shows booking confirmation.
 */
export function Confirmation(container, { bookingId }) {
  container.innerHTML = `
    <div class="cb-confirmation">
      <h3>Booking Confirmed</h3>
      <p>Your appointment has been booked. A confirmation email has been sent.</p>
      <p class="cb-booking-id">Booking ID: ${bookingId}</p>
    </div>
  `;
}
