const eventList = document.querySelector('#event-list');
const searchInput = document.querySelector('#search-input');
const categoryFilter = document.querySelector('#category-filter');
const eventForm = document.querySelector('#event-form');
const bookingDialog = document.querySelector('#booking-dialog');
const bookingForm = document.querySelector('#booking-form');
const selectedEventTitle = document.querySelector('#selected-event-title');
const notification = document.querySelector('#notification');

function showMessage(message, isError = false) {
  notification.textContent = message;
  notification.hidden = false;
  notification.classList.toggle('error', isError);
  window.clearTimeout(showMessage.timeout);
  showMessage.timeout = window.setTimeout(() => {
    notification.hidden = true;
  }, 4500);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error || 'Unable to complete request.');
  }
  return body;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

function formatDate(dateText) {
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(dateText));
}

function eventCard(event) {
  const soldOut = event.availableSeats === 0;
  return `
    <article class="event-card">
      <div class="card-top">
        <span class="category">${escapeHtml(event.category)}</span>
        <span class="seats">${event.availableSeats} seats available</span>
      </div>
      <h3>${escapeHtml(event.title)}</h3>
      <p class="description">${escapeHtml(event.description)}</p>
      <div class="details">
        <div>
          <p><strong>${formatDate(event.eventDate)}</strong></p>
          <p>${escapeHtml(event.venue)}</p>
        </div>
        <button class="primary-button book-button" data-event-id="${event.id}" data-event-title="${escapeHtml(event.title)}" ${soldOut ? 'disabled' : ''}>
          ${soldOut ? 'Sold out' : 'Book now'}
        </button>
      </div>
    </article>
  `;
}

async function loadEvents() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (categoryFilter.value) params.set('category', categoryFilter.value);

  try {
    const response = await apiRequest(`/api/events?${params}`);
    eventList.innerHTML = response.events.length
      ? response.events.map(eventCard).join('')
      : '<p>No matching events found.</p>';
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadDashboard() {
  try {
    const { summary } = await apiRequest('/api/admin/dashboard');
    document.querySelector('#event-count').textContent = summary.eventCount;
    document.querySelector('#booking-count').textContent = summary.activeBookings;
    document.querySelector('#seat-count').textContent = summary.seatsRemaining;
  } catch (error) {
    showMessage(error.message, true);
  }
}

eventList.addEventListener('click', (event) => {
  const button = event.target.closest('.book-button');
  if (!button) return;
  bookingForm.elements.eventId.value = button.dataset.eventId;
  selectedEventTitle.textContent = button.dataset.eventTitle;
  bookingDialog.showModal();
});

document.querySelector('#close-dialog').addEventListener('click', () => {
  bookingDialog.close();
});

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const eventId = bookingForm.elements.eventId.value;
  const payload = {
    attendeeName: bookingForm.elements.attendeeName.value,
    attendeeEmail: bookingForm.elements.attendeeEmail.value,
    tickets: Number(bookingForm.elements.tickets.value)
  };

  try {
    await apiRequest(`/api/events/${eventId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    bookingDialog.close();
    bookingForm.reset();
    showMessage('Your booking has been confirmed successfully.');
    await Promise.all([loadEvents(), loadDashboard()]);
  } catch (error) {
    showMessage(error.message, true);
  }
});

eventForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(eventForm);
  const payload = Object.fromEntries(formData.entries());
  payload.capacity = Number(payload.capacity);

  try {
    await apiRequest('/api/events', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    eventForm.reset();
    showMessage('New event created successfully.');
    await Promise.all([loadEvents(), loadDashboard()]);
  } catch (error) {
    showMessage(error.message, true);
  }
});

searchInput.addEventListener('input', loadEvents);
categoryFilter.addEventListener('change', loadEvents);

loadEvents();
loadDashboard();
