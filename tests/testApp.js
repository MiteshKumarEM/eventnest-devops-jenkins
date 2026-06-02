const EventNestDatabase = require('../src/database');
const createApp = require('../src/app');

async function buildTestApp() {
  const database = await EventNestDatabase.create({ filePath: ':memory:', seed: true });
  return {
    app: createApp(database),
    database
  };
}

module.exports = buildTestApp;
