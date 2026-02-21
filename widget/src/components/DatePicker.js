/**
 * Simple date picker — renders a native date input.
 * Restricts selection to today onwards.
 */
export function DatePicker(container, { onSelect }) {
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="cb-datepicker">
      <label>Select a date</label>
      <input type="date" min="${today}" value="${today}" />
    </div>
  `;

  const input = container.querySelector('input');
  input.addEventListener('change', () => onSelect(input.value));

  // Trigger initial selection
  onSelect(today);
}
