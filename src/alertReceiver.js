const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const port = Number(process.env.ALERT_PORT || 3004);
const alertFile = process.env.ALERT_LOG_PATH || './data/received-alerts.json';

app.use(express.json());

app.post('/alerts', (req, res) => {
  const alerts = Array.isArray(req.body.alerts) ? req.body.alerts : [];
  const record = {
    receivedAt: new Date().toISOString(),
    status: req.body.status || 'unknown',
    alerts
  };

  fs.mkdirSync(path.dirname(alertFile), { recursive: true });
  const existing = fs.existsSync(alertFile) ? JSON.parse(fs.readFileSync(alertFile, 'utf8')) : [];
  existing.unshift(record);
  fs.writeFileSync(alertFile, JSON.stringify(existing.slice(0, 25), null, 2));

  console.log('Alertmanager notification received:', JSON.stringify(record));
  res.status(202).json({ message: 'Alert notification received.', received: alerts.length });
});

app.get('/alerts', (req, res) => {
  const alerts = fs.existsSync(alertFile) ? JSON.parse(fs.readFileSync(alertFile, 'utf8')) : [];
  res.json({ notifications: alerts });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'eventnest-alert-receiver' });
});

app.listen(port, () => {
  console.log(`EventNest alert receiver is listening on port ${port}.`);
});
