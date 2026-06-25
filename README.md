# Decentralized Identity Infrastructure

A minimal, self-hosted Self-Sovereign Identity (SSI) environment for
learning how the pieces fit together. Three containers:

```
.
├── docker-compose.yml      # wires the 3 services together
├── .env                    # all configuration values, commented
├── did-agent/              # ACA-Py (the actual SSI agent)
│   └── Dockerfile
├── webhook-receiver/       # Node/Express dashboard for agent events
│   ├── Dockerfile
│   ├── package.json
│   └── src/, public/
└── docker/volumes/         # bind-mounted data (Postgres + agent cache)
```

## What's actually running

- **postgres** — stores the agent's wallet (DIDs, keys, connection records).
- **did-agent** — [ACA-Py](https://github.com/openwallet-foundation/acapy)
  (Aries Cloud Agent Python), the software that speaks the DIDComm
  protocol: creates connections, sends/receives messages, and (later, if
  you extend it) issues and verifies credentials.
- **webhook-receiver** — ACA-Py has no built-in UI. It instead POSTs an
  event to a webhook URL every time something happens. This service
  receives those events and shows them on a live dashboard.

### A deliberate simplification: no public ledger

Classic SSI demos register identifiers (`did:sov`) on a public Hyperledger
Indy ledger (e.g. the BCovrin test network), which requires fetching a
genesis file and registering a DID before the agent can even start.
This setup runs ACA-Py with `--no-ledger` instead, so it uses `did:peer`
DIDs — generated locally between two agents during a connection, no
ledger required. That's enough to explore DIDComm connections and
messaging. If you want real ledger-anchored DIDs later, that's a single
flag change (`--genesis-url <url>` instead of `--no-ledger`) plus a DID
registration step — ask if you want to add that next.

## Running it

```bash
docker compose up --build
```

First boot takes a minute (Postgres initializing, ACA-Py provisioning its
wallet). Once it's up:

| What                  | URL                              |
|-----------------------|-----------------------------------|
| Webhook dashboard     | http://localhost:3001             |
| ACA-Py admin API/UI   | http://localhost:8021/api/doc     |

The admin UI is a Swagger page — every action you can take on the agent
(create an invitation, list connections, send a message) is callable
from there. Most endpoints require the `X-Api-Key` header set to
`ACAPY_ADMIN_API_KEY` from your `.env`; the Swagger UI has an "Authorize"
button for this.

Stop everything with `docker compose down`. Your wallet/DB data persists
in `docker/volumes/` between runs — delete that folder if you want a
totally clean slate.

## Trying it out

A connection is the simplest thing to test end-to-end. From the admin UI
(or curl), create an invitation:

```bash
curl -X POST http://localhost:8021/connections/create-invitation \
  -H "X-Api-Key: <your ACAPY_ADMIN_API_KEY>"
```

Watch http://localhost:3001 — you should see a `connections` webhook
event appear immediately. That's ACA-Py telling you it created a new,
not-yet-completed connection record. To actually complete a connection
you need a second agent to accept that invitation (e.g. a mobile wallet
app that supports DIDComm, or a second instance of this same stack).

## Troubleshooting

- **did-agent keeps restarting / unhealthy** — check
  `docker compose logs did-agent`. The most common cause is Postgres not
  being ready yet on first boot (the `depends_on: condition: service_healthy`
  should prevent this, but a slow disk can still cause delays — give it
  another minute and re-run).
- **Webhook dashboard shows nothing** — confirm `did-agent`'s logs don't
  show webhook delivery errors, and that `WEBHOOK_PORT` in `.env` matches
  what `webhook-receiver` is actually listening on.
- **Changed `.env` but nothing changed** — environment variables are read
  at container start, not live. Run `docker compose up --build` again.

## Next steps (not included, on purpose)

This stack intentionally stops at "agent + storage + visibility" so it
stays easy to reason about. Natural next steps once you're comfortable:

- Issuing and verifying a credential (needs a credential definition and,
  if you want revocation, a tails server).
- Adding a real Indy ledger connection (`--genesis-url`) for `did:sov`.
- A second `did-agent` instance to actually complete DIDComm connections
  between two independent agents instead of just creating invitations.
