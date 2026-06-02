const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

class EventNestDatabase {
  constructor(db, filePath) {
    this.db = db;
    this.filePath = filePath;
  }

  static async create({ filePath = process.env.DB_PATH || './data/eventnest.db', seed = true } = {}) {
    const wasmDirectory = path.dirname(require.resolve('sql.js'));
    const SQL = await initSqlJs({
      locateFile: (file) => path.join(wasmDirectory, file)
    });

    let sqliteDb;
    if (filePath !== ':memory:' && fs.existsSync(filePath)) {
      sqliteDb = new SQL.Database(fs.readFileSync(filePath));
    } else {
      sqliteDb = new SQL.Database();
    }

    const database = new EventNestDatabase(sqliteDb, filePath);
    database.migrate();

    if (seed) {
      database.seed();
    }

    return database;
  }

  migrate() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        venue TEXT NOT NULL,
        event_date TEXT NOT NULL,
        capacity INTEGER NOT NULL CHECK (capacity > 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        attendee_name TEXT NOT NULL,
        attendee_email TEXT NOT NULL,
        tickets INTEGER NOT NULL DEFAULT 1 CHECK (tickets > 0),
        status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        cancelled_at TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id)
      );

      CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
      CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(attendee_email);
    `);
    this.persist();
  }

  seed() {
    const record = this.get('SELECT COUNT(*) AS count FROM events');
    if (record.count > 0) {
      return;
    }

    const futureDate = (days, time) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return `${date.toISOString().slice(0, 10)}T${time}:00`;
    };

    const sampleEvents = [
      ['Melbourne Tech Connect', 'Meet local technology professionals and explore modern software delivery practices.', 'Technology', 'Innovation Hub, Melbourne', futureDate(14, '18:00'), 80],
      ['Data Visualisation Workshop', 'A practical workshop for building clear and engaging dashboards.', 'Workshop', 'Campus Learning Studio', futureDate(21, '10:00'), 35],
      ['Community Fitness Morning', 'A social outdoor fitness session suitable for all experience levels.', 'Wellbeing', 'Flagstaff Gardens', futureDate(10, '08:00'), 50],
      ['Sustainable Food Festival', 'Discover local vegetarian food stalls and sustainable cooking ideas.', 'Community', 'Docklands Pavilion', futureDate(30, '11:30'), 120]
    ];

    sampleEvents.forEach((event) => {
      this.run(
        `INSERT INTO events (title, description, category, venue, event_date, capacity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        event
      );
    });
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    const idResult = this.get('SELECT last_insert_rowid() AS id');
    this.persist();
    return { lastID: idResult ? idResult.id : undefined };
  }

  all(sql, params = []) {
    const statement = this.db.prepare(sql);
    statement.bind(params);
    const rows = [];

    while (statement.step()) {
      rows.push(statement.getAsObject());
    }

    statement.free();
    return rows;
  }

  get(sql, params = []) {
    return this.all(sql, params)[0];
  }

  persist() {
    if (this.filePath === ':memory:') {
      return;
    }
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(this.filePath, Buffer.from(this.db.export()));
  }

  close() {
    this.db.close();
  }
}

module.exports = EventNestDatabase;
