class DashboardService {
  constructor(database) {
    this.database = database;
  }

  getSummary() {
    const eventCount = this.database.get('SELECT COUNT(*) AS total FROM events').total;
    const activeBookings = this.database.get(
      `SELECT COUNT(*) AS total FROM bookings WHERE status = 'ACTIVE'`
    ).total;
    const bookedSeats = this.database.get(
      `SELECT COALESCE(SUM(tickets), 0) AS total FROM bookings WHERE status = 'ACTIVE'`
    ).total;
    const totalCapacity = this.database.get(
      'SELECT COALESCE(SUM(capacity), 0) AS total FROM events'
    ).total;

    return {
      eventCount,
      activeBookings,
      bookedSeats,
      totalCapacity,
      seatsRemaining: totalCapacity - bookedSeats
    };
  }
}

module.exports = DashboardService;
