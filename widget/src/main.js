import { setBaseUrl, fetchAvailability, createBooking } from './api.js';
import { DatePicker } from './components/DatePicker.js';
import { TimeSlots } from './components/TimeSlots.js';
import { BookingForm } from './components/BookingForm.js';
import { Confirmation } from './components/Confirmation.js';

/**
 * Initialize the booking widget.
 *
 * Usage:
 *   CalendarBooking.init({
 *     el: '#booking-widget',
 *     apiUrl: 'http://localhost:3000',
 *     ownerId: 'owner-123',
 *   });
 */
window.CalendarBooking = {
  init({ el, apiUrl, ownerId }) {
    setBaseUrl(apiUrl);

    const root = typeof el === 'string' ? document.querySelector(el) : el;
    if (!root) throw new Error(`Element not found: ${el}`);

    root.classList.add('cb-widget');

    // State
    let selectedDate = null;
    let selectedSlot = null;
    let currentTimezone = null;

    // Sections
    const dateSection = document.createElement('div');
    const slotsSection = document.createElement('div');
    const formSection = document.createElement('div');
    const confirmSection = document.createElement('div');
    root.append(dateSection, slotsSection, formSection, confirmSection);

    // Step 1: Date picker
    DatePicker(dateSection, {
      onSelect: async (date) => {
        selectedDate = date;
        selectedSlot = null;
        formSection.innerHTML = '';
        confirmSection.innerHTML = '';
        slotsSection.innerHTML = '<p class="cb-loading">Loading...</p>';

        try {
          const data = await fetchAvailability(ownerId, date);
          currentTimezone = data.timezone;
          TimeSlots(slotsSection, {
            slots: data.slots,
            timezone: data.timezone,
            onSelect: (slot) => {
              selectedSlot = slot;
              confirmSection.innerHTML = '';
              BookingForm(formSection, { onSubmit: handleBooking });
            },
          });
        } catch (err) {
          slotsSection.innerHTML = `<p class="cb-error">${err.message}</p>`;
        }
      },
    });

    // Step 3: Handle booking submission
    async function handleBooking({ customerName, customerEmail, notes }) {
      const submitBtn = formSection.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Booking...';

      try {
        const result = await createBooking({
          ownerId,
          customerName,
          customerEmail,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes,
        });

        formSection.innerHTML = '';
        slotsSection.innerHTML = '';
        Confirmation(confirmSection, { bookingId: result.booking_id });
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
        const errorEl = formSection.querySelector('.cb-error') || document.createElement('p');
        errorEl.className = 'cb-error';
        errorEl.textContent = err.message;
        formSection.querySelector('form').appendChild(errorEl);
      }
    }
  },
};
