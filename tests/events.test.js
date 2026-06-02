const request = require('supertest');
const buildTestApp = require('./testApp');

describe('Event endpoints', () => {
  let app;
  let database;

  beforeEach(async () => {
    ({ app, database } = await buildTestApp());
  });

  afterEach(() => {
    database.close();
  });

  test('returns seeded upcoming events with seat availability', async () => {
    const response = await request(app).get('/api/events').expect(200);

    expect(response.body.events.length).toBeGreaterThanOrEqual(4);
    expect(response.body.events[0]).toHaveProperty('availableSeats');
    expect(response.body.events[0].availableSeats).toBe(response.body.events[0].capacity);
  });

  test('creates a valid new event', async () => {
    const eventPayload = {
      title: 'DevOps Showcase',
      description: 'A demonstration of automated delivery pipelines.',
      category: 'Technology',
      venue: 'Online',
      eventDate: '2027-06-15T18:00',
      capacity: 60
    };

    const response = await request(app).post('/api/events').send(eventPayload).expect(201);

    expect(response.body.event.title).toBe('DevOps Showcase');
    expect(response.body.event.availableSeats).toBe(60);
  });

  test('rejects an event with invalid capacity', async () => {
    const response = await request(app).post('/api/events').send({
      title: 'Invalid Event',
      description: 'This event should fail validation.',
      category: 'Workshop',
      venue: 'Campus',
      eventDate: '2027-06-15T18:00',
      capacity: 0
    }).expect(400);

    expect(response.body.error).toMatch(/Capacity/);
  });

  test('filters events by category', async () => {
    const response = await request(app).get('/api/events?category=Technology').expect(200);

    expect(response.body.events.length).toBeGreaterThan(0);
    response.body.events.forEach((event) => {
      expect(event.category).toBe('Technology');
    });
  });
});
