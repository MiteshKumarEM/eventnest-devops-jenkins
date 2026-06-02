const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const createMetrics = require('./monitoring/metrics');
const EventService = require('./services/eventService');
const BookingService = require('./services/bookingService');
const DashboardService = require('./services/dashboardService');
const createEventRoutes = require('./routes/eventRoutes');
const createBookingRoutes = require('./routes/bookingRoutes');
const createAdminRoutes = require('./routes/adminRoutes');
const createMonitoringRoutes = require('./routes/monitoringRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp(database) {
  const app = express();
  const metrics = createMetrics();

  const eventService = new EventService(database);
  const bookingService = new BookingService(database, eventService, metrics);
  const dashboardService = new DashboardService(database);

  app.locals.metrics = metrics;
  app.locals.database = database;

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'https://images.unsplash.com', 'data:']
      }
    }
  }));
  app.use(cors());
  app.use(express.json({ limit: '20kb' }));
  app.use(metrics.monitoringMiddleware);

  app.use(createMonitoringRoutes(database, metrics));
  app.use('/api/events', createEventRoutes(eventService, bookingService));
  app.use('/api/bookings', createBookingRoutes(bookingService));
  app.use('/api/admin', createAdminRoutes(dashboardService));

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
