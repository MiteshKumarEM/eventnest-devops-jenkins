const client = require('prom-client');

function createMetrics() {
  const registry = new client.Registry();
  registry.setDefaultLabels({ application: 'eventnest' });
  client.collectDefaultMetrics({ register: registry, prefix: 'eventnest_' });

  const httpDuration = new client.Histogram({
    name: 'eventnest_http_request_duration_seconds',
    help: 'Duration of EventNest HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2]
  });

  const bookingsCreated = new client.Counter({
    name: 'eventnest_bookings_created_total',
    help: 'Number of successfully created bookings',
    registers: [registry]
  });

  const bookingsCancelled = new client.Counter({
    name: 'eventnest_bookings_cancelled_total',
    help: 'Number of successfully cancelled bookings',
    registers: [registry]
  });

  const monitoringMiddleware = (req, res, next) => {
    const endTimer = httpDuration.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      endTimer({
        method: req.method,
        route,
        status_code: res.statusCode
      });
    });
    next();
  };

  return {
    registry,
    bookingsCreated,
    bookingsCancelled,
    monitoringMiddleware
  };
}

module.exports = createMetrics;
