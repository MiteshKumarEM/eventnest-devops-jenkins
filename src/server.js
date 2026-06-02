const EventNestDatabase = require('./database');
const createApp = require('./app');

const port = Number(process.env.PORT || 3000);
const dbPath = process.env.DB_PATH || './data/eventnest.db';

async function startServer() {
  const database = await EventNestDatabase.create({ filePath: dbPath, seed: true });
  const app = createApp(database);

  const server = app.listen(port, () => {
    console.log(`EventNest is running on port ${port}.`);
    console.log(`Health endpoint available at http://localhost:${port}/api/health`);
    console.log(`Prometheus metrics available at http://localhost:${port}/metrics`);
  });

  const shutdown = () => {
    console.log('Shutting down EventNest safely.');
    server.close(() => {
      database.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((error) => {
  console.error('EventNest failed to start:', error);
  process.exit(1);
});
