const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const { runSource, sources } = require('./index');
const dedupe = require('../lib/dedupe');
const db = require('../lib/db');
const logger = require('../lib/logger');

// Minimal contract for the scraper function:
// input: url string
// output: { title, description, listings: [{title, link, summary, deadline?}], source, scrapedAt }
async function scrapeScholarshipPage(url, options = {}) {
  if (!url) throw new Error('Missing url');
  const timeout = options.timeout || 10000;
  const resp = await axios.get(url, { timeout });
  const $ = cheerio.load(resp.data);

  const title = $('title').first().text() || null;
  const description = $('meta[name="description"]').attr('content') || null;

  // Heuristic: find likely listing items (common on gov/NGO pages)
  const listings = [];
  // Try a few selectors commonly used for lists/articles
  const candidates = $('article, .listing, .scholarship, .card, li, .result');
  candidates.each((i, el) => {
    if (i >= 50) return; // limit
    const $el = $(el);
    const a = $el.find('a').first();
    const itemTitle = $el.find('h2,h3').first().text().trim() || a.text().trim() || null;
    const link = a.attr('href') || null;
    const summary = $el.find('p').first().text().trim() || null;

    if (itemTitle || summary || link) {
      listings.push({ title: itemTitle, link, summary });
    }
  });

  // Fallback: if no candidates found, look for anchor tags with relevant keywords
  if (listings.length === 0) {
    $('a').each((i, el) => {
      if (i >= 80) return;
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href');
      if (!href) return;
      const keywordMatch = /scholarship|apply|deadline|eligib|post|scheme/i.test(text);
      if (keywordMatch) listings.push({ title: text, link: href, summary: null });
    });
  }

  return {
    title,
    description,
    listings,
    source: url,
    scrapedAt: new Date().toISOString()
  };
}

// Helper: parse HTML string directly (useful for local tests)
function parseHtmlString(html, source = 'inline') {
  const $ = cheerio.load(html);
  const title = $('title').first().text() || null;
  const description = $('meta[name="description"]').attr('content') || null;

  const listings = [];
  const candidates = $('article, .listing, .scholarship, .card, li, .result');
  candidates.each((i, el) => {
    if (i >= 50) return;
    const $el = $(el);
    const a = $el.find('a').first();
    const itemTitle = $el.find('h2,h3').first().text().trim() || a.text().trim() || null;
    const link = a.attr('href') || null;
    const summary = $el.find('p').first().text().trim() || null;
    if (itemTitle || summary || link) listings.push({ title: itemTitle, link, summary });
  });

  if (listings.length === 0) {
    $('a').each((i, el) => {
      if (i >= 80) return;
      const $a = $(el);
      const text = $a.text().trim();
      const href = $a.attr('href');
      if (!href) return;
      const keywordMatch = /scholarship|apply|deadline|eligib|post|scheme/i.test(text);
      if (keywordMatch) listings.push({ title: text, link: href, summary: null });
    });
  }

  return {
    title,
    description,
    listings,
    source,
    scrapedAt: new Date().toISOString()
  };
}

// Generic scraper endpoint: GET /scrape?url=
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url query parameter' });

  try {
    const result = await scrapeScholarshipPage(url);
    res.json(result);
  } catch (err) {
    console.error('Scrape error', err && err.message ? err.message : err);
    res.status(500).json({ error: 'Failed to fetch or parse url', details: err.message || String(err) });
  }
});

// Demo route that scrapes a sample scholarships/info page (publicly accessible)
router.get('/demo', async (req, res) => {
  // A very small, stable sample page — use the Vite public site or a known page.
  const sample = req.query.url || 'https://www.education.gov.in/en/scholarship';
  try {
    const data = await scrapeScholarshipPage(sample);
    res.json({ demoFor: sample, data });
  } catch (err) {
    res.status(500).json({ error: 'Demo scrape failed', details: err.message });
  }
});

// Run a registered source scraper by key: GET /scrape/source/:sourceKey
router.get('/source/:sourceKey', async (req, res) => {
  const { sourceKey } = req.params;
  if (!sourceKey) return res.status(400).json({ error: 'Missing sourceKey' });
    try {
      if (!sources[sourceKey]) return res.status(404).json({ error: 'Unknown source' });
      const store = req.query.store === 'true' || req.query.store === '1';
      const expand = req.query.expand === '1' || req.query.expand === 'true';
  const result = await runSource(sourceKey, { url: req.query.url, expand });
    if (store && db.isConnected()) {
      const saved = [];
      for (const item of result.listings) {
        const payload = {
          title: item.title || 'Untitled',
          link: item.link,
          summary: item.summary || null,
          source: result.source || sourceKey,
          scrapedAt: result.scrapedAt ? new Date(result.scrapedAt) : new Date()
        };
        try {
          const doc = await dedupe.upsertScholarship(payload);
          saved.push(doc);
        } catch (err) {
          logger.warn('Failed to upsert item: %s', err.message);
        }
      }
      return res.json(Object.assign({ source: sourceKey, url: result.url, listings: result.listings.length, stored: saved.length }, result.diagnostics ? { diagnostics: result.diagnostics } : {}));
    }
    // Include diagnostics if the scraper returned them
    res.json(result.diagnostics ? Object.assign({}, result, { diagnostics: result.diagnostics }) : result);
  } catch (err) {
    console.error('Source scrape error', err && err.message ? err.message : err);
    // If the source implementation threw an Error with a message, include it as diagnostics
    // If the thrown error has attached diagnostics (e.g., probeResults), include them in the response for debugging
    const payload = { error: 'Source scrape failed', details: err.message || String(err) };
    if (err && err.probeResults) payload.diagnostics = { probeResults: err.probeResults };
    res.status(502).json(payload);
  }
});

module.exports = router;
module.exports.scrapeScholarshipPage = scrapeScholarshipPage;
module.exports.parseHtmlString = parseHtmlString;
