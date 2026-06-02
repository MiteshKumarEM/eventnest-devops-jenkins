const express = require('express');

function createMonitoringRoutes(database, metrics) {
  const router = express.Router();

  router.get('/api/health', (req, res) => {
    const databaseCheck = database.get('SELECT 1 AS connected');
    res.json({
      status: 'healthy',
      application: 'EventNest',
      database: databaseCheck.connected === 1 ? 'connected' : 'unavailable',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  router.get('/metrics', async (req, res) => {
    res.set('Content-Type', metrics.registry.contentType);
    res.send(await metrics.registry.metrics());
  });

  return router;
}

module.exports = createMonitoringRoutes;
