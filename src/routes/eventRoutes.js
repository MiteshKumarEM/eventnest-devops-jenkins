const express = require('express');

function createEventRoutes(eventService, bookingService) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const events = eventService.listEvents({
      search: req.query.search,
      category: req.query.category
    });
    res.json({ events });
  });

  router.get('/:id', (req, res) => {
    res.json({ event: eventService.getEvent(Number(req.params.id)) });
  });

  router.post('/', (req, res) => {
    const event = eventService.createEvent(req.body);
    res.status(201).json({ message: 'Event created successfully.', event });
  });

  router.post('/:id/bookings', (req, res) => {
    const result = bookingService.createBooking(Number(req.params.id), req.body);
    res.status(201).json({ message: 'Booking confirmed successfully.', ...result });
  });

  return router;
}

module.exports = createEventRoutes;
