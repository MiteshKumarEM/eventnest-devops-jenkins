const request = require('supertest');
const buildTestApp = require('./testApp');

describe('Booking business rules', () => {
  let app;
  let database;

  beforeEach(async () => {
    ({ app, database } = await buildTestApp());
  });

  afterEach(() => {
    database.close();
  });

  test('confirms a booking and reduces available seats', async () => {
    const response = await request(app).post('/api/events/1/bookings').send({
      attendeeName: 'Alex Morgan',
      attendeeEmail: 'alex@example.com',
      tickets: 2
    }).expect(201);

    expect(response.body.booking.status).toBe('ACTIVE');
    expect(response.body.event.availableSeats).toBe(response.body.event.capacity - 2);
  });

  test('prevents duplicate active bookings for one email and event', async () => {
    const booking = {
      attendeeName: 'Alex Morgan',
      attendeeEmail: 'alex@example.com',
      tickets: 1
    };

    await request(app).post('/api/events/1/bookings').send(booking).expect(201);
    const duplicate = await request(app).post('/api/events/1/bookings').send(booking).expect(409);

    expect(duplicate.body.error).toMatch(/already has an active booking/);
  });

  test('prevents bookings above event capacity', async () => {
    await request(app).post('/api/events').send({
      title: 'Small Group Session',
      description: 'Limited seating.',
      category: 'Workshop',
      venue: 'Room A',
      eventDate: '2027-06-15T18:00',
      capacity: 2
    }).expect(201);

    const response = await request(app).post('/api/events/5/bookings').send({
      attendeeName: 'Jordan Smith',
      attendeeEmail: 'jordan@example.com',
      tickets: 3
    }).expect(409);

    expect(response.body.error).toMatch(/not enough seats/);
  });

  test('cancels a booking and restores available seats', async () => {
    const created = await request(app).post('/api/events/1/bookings').send({
      attendeeName: 'Taylor Lee',
      attendeeEmail: 'taylor@example.com',
      tickets: 3
    }).expect(201);

    const bookingId = created.body.booking.id;
    const cancelled = await request(app).delete(`/api/bookings/${bookingId}`).expect(200);

    expect(cancelled.body.booking.status).toBe('CANCELLED');
    expect(cancelled.body.event.availableSeats).toBe(cancelled.body.event.capacity);
  });
});
