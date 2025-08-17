# SC2 Backend

Prototype backend for the Scholarship & Exam aggregator (hackathon).

Run:

- Install dependencies: npm install
- Start dev server: npm run dev

Endpoints:
- GET /health - health check
- GET /scrape?url=... - basic scraper endpoint (demo)

Notes:
- The demo endpoint uses a sample URL and heuristic parsing; public network errors or 404s may occur.
- Added `scrape` npm script that verifies the scraper module can be loaded: `npm run scrape`.
	This does not perform a full scrape by default.

MongoDB (optional)
-------------------
You can enable MongoDB storage for parsed scholarships. Steps:

1. Copy `.env.example` to `.env` and set `MONGODB_URI` (e.g. `mongodb://localhost:27017/sc2`).

2. Install dependencies and start server:

	npm install
	npm run dev

3. To migrate existing `backend/data/store.json` into MongoDB (once `MONGODB_URI` is set):

	node migrate-store-to-mongo.js

The server will use MongoDB when it can connect; otherwise it falls back to the file-based store.
