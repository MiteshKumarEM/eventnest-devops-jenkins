const request = require('supertest');
const buildTestApp = require('./testApp');

describe('Health and monitoring endpoints', () => {
  let app;
  let database;

  beforeEach(async () => {
    ({ app, database } = await buildTestApp());
  });

  afterEach(() => {
    database.close();
  });

  test('health endpoint confirms application and database availability', async () => {
    const response = await request(app).get('/api/health').expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.database).toBe('connected');
    expect(response.body.application).toBe('EventNest');
  });

  test('metrics endpoint exposes Prometheus application metrics', async () => {
    const response = await request(app).get('/metrics').expect(200);

    expect(response.text).toContain('eventnest_http_request_duration_seconds');
    expect(response.text).toContain('eventnest_process_cpu');
  });
});
