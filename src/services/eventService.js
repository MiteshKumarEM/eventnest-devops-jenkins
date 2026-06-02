const AppError = require('../utils/AppError');

class EventService {
  constructor(database) {
    this.database = database;
  }

  formatEvent(row) {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      venue: row.venue,
      eventDate: row.event_date,
      capacity: row.capacity,
      bookedSeats: row.booked_seats || 0,
      availableSeats: row.capacity - (row.booked_seats || 0)
    };
  }

  eventQuery(where = '') {
    return `
      SELECT e.*,
        COALESCE(SUM(CASE WHEN b.status = 'ACTIVE' THEN b.tickets ELSE 0 END), 0) AS booked_seats
      FROM events e
      LEFT JOIN bookings b ON e.id = b.event_id
      ${where}
      GROUP BY e.id
    `;
  }

  listEvents({ search = '', category = '' } = {}) {
    const filters = [];
    const params = [];

    if (search.trim()) {
      filters.push('(LOWER(e.title) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.venue) LIKE ?)');
      const keyword = `%${search.trim().toLowerCase()}%`;
      params.push(keyword, keyword, keyword);
    }

    if (category.trim()) {
      filters.push('LOWER(e.category) = ?');
      params.push(category.trim().toLowerCase());
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const rows = this.database.all(`${this.eventQuery(where)} ORDER BY e.event_date ASC`, params);
    return rows.map((row) => this.formatEvent(row));
  }

  getEvent(id) {
    const row = this.database.get(`${this.eventQuery('WHERE e.id = ?')} `, [id]);
    if (!row) {
      throw new AppError('Event not found.', 404);
    }
    return this.formatEvent(row);
  }

  createEvent(input) {
    const title = String(input.title || '').trim();
    const description = String(input.description || '').trim();
    const category = String(input.category || '').trim();
    const venue = String(input.venue || '').trim();
    const eventDate = String(input.eventDate || '').trim();
    const capacity = Number(input.capacity);

    if (!title || !description || !category || !venue || !eventDate) {
      throw new AppError('Title, description, category, venue and event date are required.');
    }

    if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1000) {
      throw new AppError('Capacity must be a whole number between 1 and 1000.');
    }

    if (Number.isNaN(Date.parse(eventDate))) {
      throw new AppError('A valid event date is required.');
    }

    const result = this.database.run(
      `INSERT INTO events (title, description, category, venue, event_date, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, category, venue, eventDate, capacity]
    );

    return this.getEvent(result.lastID);
  }
}

module.exports = EventService;
