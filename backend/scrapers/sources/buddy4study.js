const cheerio = require('cheerio');
const { fetchUrl } = require('../httpClient');
const { resolveUrl, extractDeadline, extractEligibility } = require('./helpers');

module.exports = async function buddy4studyScraper(options = {}) {
  const candidates = options.candidates || [
    'https://www.buddy4study.com/scholarship',
    'https://www.buddy4study.com/scholarships',
    'https://www.buddy4study.com/scholarship-list',
    'https://www.buddy4study.com/scholarship-listing'
  ];
  let baseUrl = options.url || null;
  let html = null;
  const probeResults = [];
  const logger = require('../../lib/logger');
  const headless = require('../headless');
  const attemptDiagnostics = { http: null, headless: null };

  if (!baseUrl) {
    for (const c of candidates) {
      try {
        const body = await fetchUrl(c);
        html = body;
        baseUrl = c;
        probeResults.push({ url: c, ok: true });
        break;
      } catch (e) {
        logger.info('Buddy4Study candidate failed: %s -> %s', c, e.message);
        probeResults.push({ url: c, ok: false, error: e.message });
      }
    }
  } else {
    try {
      html = await fetchUrl(baseUrl);
    } catch (e) {
      logger.warn('Buddy4Study base url failed: %s -> %s', baseUrl, e.message);
      probeResults.push({ url: baseUrl, ok: false, error: e.message });
    }
  }
  if (!html) {
    // Try a headless fallback (renders JS)
    const tryUrl = baseUrl || candidates[0];
    const startHL = Date.now();
    try {
      const rendered = await headless.fetchHtml(tryUrl, { timeout: options.headlessTimeout || 25000, waitForSelector: '.scholarship-card' });
      html = rendered;
      attemptDiagnostics.headless = { ok: true, tookMs: Date.now() - startHL };
      // set baseUrl if we used candidate
      if (!baseUrl) baseUrl = tryUrl;
    } catch (e) {
      attemptDiagnostics.headless = { ok: false, error: e.message, tookMs: Date.now() - startHL };
      const msg = 'No listing page found for Buddy4Study';
      const err = new Error(msg + ' (http and headless attempts failed)');
      err.probeResults = probeResults;
      err.attemptDiagnostics = attemptDiagnostics;
      throw err;
    }
  } else {
    attemptDiagnostics.http = { ok: true };
  }
  const $ = cheerio.load(html);
  const listings = [];
  const expand = options.expand;
  const delay = options.delay || 300; // ms between detail fetches

  // Heuristic 1: collect anchors with common scholarship paths (/scholarship/, /page/, /scholarships/)
  $('a[href]').each((i, el) => {
    try {
      const href = $(el).attr('href');
      const text = $(el).text().trim().replace(/\s+/g, ' ');
      if (!href) return;
      if (/\/scholarship\//i.test(href) || /\/page\//i.test(href) || /\/scholarships/i.test(href)) {
        const link = resolveUrl(baseUrl, href);
        if (link) listings.push({ title: text || null, link, summary: null });
      }
    } catch (e) {
      // ignore
    }
  });

  // Look for scholarship cards — site markup varies so try multiple selectors
  $('.scholarship-card, .card, .listing-card, .scholarship_list, .listing').each((i, el) => {
    const $el = $(el);
    const a = $el.find('a').first();
    const href = a.attr('href');
    const title = $el.find('h3, h2').first().text().trim() || a.text().trim();
    const link = href ? resolveUrl(baseUrl, href) : null;
    const summary = $el.find('.desc, p').first().text().trim() || null;
    if (title || link) listings.push({ title, link, summary });
  });

  // Fallback anchors
  if (listings.length === 0) {
    $('a').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (href && /scholarship|apply|deadline/i.test(text)) listings.push({ title: text, link: resolveUrl(baseUrl, href) });
    });
  }

  // Deduplicate and restrict to same-domain links
  const seen = new Set();
  const filtered = [];
  for (const it of listings) {
    if (!it.link) continue;
    try {
      const u = new URL(it.link);
      if (!u.hostname.includes('buddy4study.com')) continue;
    } catch (e) {
      continue;
    }
    const key = it.link;
    if (seen.has(key)) continue;
    seen.add(key);
    filtered.push(it);
  }

  // Optionally expand
  if (expand && filtered.length > 0) {
    for (const item of filtered) {
      try {
        const detailHtml = await fetchUrl(item.link);
        const $d = cheerio.load(detailHtml);
        const bodyText = $d('body').text();
        item.summary = item.summary || $d('meta[name="description"]').attr('content') || (bodyText || '').trim().slice(0, 300);
        item.deadline = extractDeadline(bodyText) || null;
        item.eligibility = extractEligibility(bodyText) || null;
      } catch (e) {
        // ignore
      }
      // polite delay
      await require('./helpers').sleep(delay);
    }
  }

  const diagnostics = Object.assign({ probeResults }, attemptDiagnostics);
  return { source: 'buddy4study', url: baseUrl, listings: filtered, diagnostics };
};
