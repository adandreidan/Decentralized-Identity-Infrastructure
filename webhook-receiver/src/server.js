// ───────────────────────────────────────────────────────────────────────────
// webhook-receiver/src/server.js
//
// What this does, top to bottom:
//   1. ACA-Py is configured (in docker-compose.yml's --webhook-url) to POST
//      a JSON body to this server every time something happens — a new
//      connection, an incoming message, a credential update, etc.
//   2. We store the last N of those events in memory.
//   3. We serve a dashboard (public/index.html) that polls us for the
//      current list and renders it.
//
// No database here on purpose — this is a debugging/visualization tool,
// not part of the agent's durable state. Restarting it just clears the
// history, which is fine.
// ───────────────────────────────────────────────────────────────────────────

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// How many events to keep before dropping the oldest ones. Without a cap,
// a long-running agent would eventually grow this array forever.
const MAX_EVENTS = 200;

// In-memory event log. Newest event is always at index 0.
const events = [];

// Express needs this middleware to parse a JSON request body into
// req.body — without it, req.body would be undefined.
app.use(express.json());

// Serve the dashboard's HTML/CSS/JS as static files.
// A GET to "/" will resolve to public/index.html automatically.
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Webhook endpoint ────────────────────────────────────────────────────
//
// ACA-Py's --webhook-url flag is set to:
//   http://webhook-receiver:3000/webhook
// and ACA-Py appends "/topic/<topic-name>" itself, e.g.
//   POST /webhook/topic/connections
//   POST /webhook/topic/basicmessages
// The :topic part of the path tells us which kind of event this is.
app.post('/webhook/topic/:topic', (req, res) => {
  const event = {
    // Date.now() is unique enough here since events arrive one at a time;
    // good enough as a React-style "key" for the dashboard.
    id: Date.now(),
    topic: req.params.topic,
    receivedAt: new Date().toISOString(),
    payload: req.body,
  };

  events.unshift(event);
  if (events.length > MAX_EVENTS) {
    events.length = MAX_EVENTS; // drop everything past the cap
  }

  console.log(`[webhook] topic=${event.topic}`);

  // ACA-Py treats anything other than a 2xx response as a delivery
  // failure and will retry — always acknowledge receipt.
  res.sendStatus(200);
});

// ── Dashboard data API ──────────────────────────────────────────────────
// The frontend polls this on an interval to refresh the event list.
app.get('/api/events', (req, res) => {
  res.json(events);
});

// Lets the dashboard's "Clear" button wipe server-side history too.
app.delete('/api/events', (req, res) => {
  events.length = 0;
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on http://localhost:${PORT}`);
  console.log(`ACA-Py should POST events to http://webhook-receiver:${PORT}/webhook/topic/<topic>`);
});
