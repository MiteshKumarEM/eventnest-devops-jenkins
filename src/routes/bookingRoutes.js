const express = require('express');

function createBookingRoutes(bookingService) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json({ bookings: bookingService.listBookings() });
  });

  router.delete('/:id', (req, res) => {
    const result = bookingService.cancelBooking(Number(req.params.id));
    res.json({ message: 'Booking cancelled successfully.', ...result });
  });

  return router;
}

module.exports = createBookingRoutes;
