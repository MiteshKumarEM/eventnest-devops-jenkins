const express = require('express');

function createAdminRoutes(dashboardService) {
  const router = express.Router();

  router.get('/dashboard', (req, res) => {
    res.json({ summary: dashboardService.getSummary() });
  });

  return router;
}

module.exports = createAdminRoutes;
