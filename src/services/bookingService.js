const AppError = require('../utils/AppError');

class BookingService {
  constructor(database, eventService, metrics) {
    this.database = database;
    this.eventService = eventService;
    this.metrics = metrics;
  }

  createBooking(eventId, input) {
    const event = this.eventService.getEvent(eventId);
    const attendeeName = String(input.attendeeName || '').trim();
    const attendeeEmail = String(input.attendeeEmail || '').trim().toLowerCase();
    const tickets = Number(input.tickets || 1);

    if (!attendeeName || !attendeeEmail || !attendeeEmail.includes('@')) {
      throw new AppError('A valid attendee name and email address are required.');
    }

    if (!Number.isInteger(tickets) || tickets < 1 || tickets > 5) {
      throw new AppError('Each booking must contain between 1 and 5 tickets.');
    }

    const duplicate = this.database.get(
      `SELECT id FROM bookings
       WHERE event_id = ? AND LOWER(attendee_email) = ? AND status = 'ACTIVE'`,
      [eventId, attendeeEmail]
    );

    if (duplicate) {
      throw new AppError('This email address already has an active booking for the event.', 409);
    }

    if (tickets > event.availableSeats) {
      throw new AppError('There are not enough seats available for this booking.', 409);
    }

    const result = this.database.run(
      `INSERT INTO bookings (event_id, attendee_name, attendee_email, tickets)
       VALUES (?, ?, ?, ?)`,
      [eventId, attendeeName, attendeeEmail, tickets]
    );

    if (this.metrics) {
      this.metrics.bookingsCreated.inc();
    }

    return {
      booking: this.getBooking(result.lastID),
      event: this.eventService.getEvent(eventId)
    };
  }

  getBooking(id) {
    const booking = this.database.get(
      `SELECT id, event_id, attendee_name, attendee_email, tickets, status, created_at, cancelled_at
       FROM bookings WHERE id = ?`,
      [id]
    );

    if (!booking) {
      throw new AppError('Booking not found.', 404);
    }

    return {
      id: booking.id,
      eventId: booking.event_id,
      attendeeName: booking.attendee_name,
      attendeeEmail: booking.attendee_email,
      tickets: booking.tickets,
      status: booking.status,
      createdAt: booking.created_at,
      cancelledAt: booking.cancelled_at
    };
  }

  cancelBooking(id) {
    const booking = this.getBooking(id);

    if (booking.status === 'CANCELLED') {
      throw new AppError('This booking has already been cancelled.', 409);
    }

    this.database.run(
      `UPDATE bookings SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );

    if (this.metrics) {
      this.metrics.bookingsCancelled.inc();
    }

    return {
      booking: this.getBooking(id),
      event: this.eventService.getEvent(booking.eventId)
    };
  }

  listBookings() {
    return this.database.all(
      `SELECT b.id, b.attendee_name, b.attendee_email, b.tickets, b.status, b.created_at,
              e.title AS event_title
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       ORDER BY b.created_at DESC`
    ).map((booking) => ({
      id: booking.id,
      attendeeName: booking.attendee_name,
      attendeeEmail: booking.attendee_email,
      tickets: booking.tickets,
      status: booking.status,
      createdAt: booking.created_at,
      eventTitle: booking.event_title
    }));
  }
}

module.exports = BookingService;
