const express = require('express');
const router = express.Router();
const storage = require('../lib/storage');
const path = require('path');
const fs = require('fs');
const scraper = require('../scrapers/scholarshipScraper');
const db = require('../lib/db');
let ScholarshipModel;
try {
  ScholarshipModel = require('../models/scholarship');
} catch (e) {
  ScholarshipModel = null;
}

// GET /api/scholarships - list stored items
router.get('/', async (req, res) => {
  if (db.isConnected() && ScholarshipModel) {
    const docs = await ScholarshipModel.find().sort({ createdAt: -1 }).limit(200).lean();
    return res.json(docs);
  }
  const items = storage.readStore();
  res.json(items);
});

// POST /api/scrape-local - parse backend/test-data/sample.html and store
router.post('/scrape-local', async (req, res) => {
  const samplePath = path.join(__dirname, '..', 'test-data', 'sample.html');
  if (!fs.existsSync(samplePath)) return res.status(404).json({ error: 'sample not found' });
  const html = fs.readFileSync(samplePath, 'utf8');
  const parsed = scraper.parseHtmlString(html, 'file://' + samplePath);
  // Save parsed listings as separate items (Mongo when available)
  const stored = [];
  for (const l of parsed.listings) {
    const payload = {
      title: l.title || 'Untitled',
      link: l.link,
      summary: l.summary,
      source: parsed.source,
      scrapedAt: parsed.scrapedAt ? new Date(parsed.scrapedAt) : new Date()
    };
    if (db.isConnected() && ScholarshipModel) {
      const doc = await ScholarshipModel.create(payload);
      stored.push(doc);
    } else {
      const item = Object.assign({ id: Date.now() + Math.floor(Math.random() * 1000) }, payload);
      storage.addItem(item);
      stored.push(item);
    }
  }

  res.json({ stored: stored.length });
});

module.exports = router;
