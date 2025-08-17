const normalizeUrl = require('normalize-url');
const Scholarship = require('../models/scholarship');
const logger = require('./logger');

function normalize(link) {
  if (!link) return null;
  try {
    return normalizeUrl(link, { stripWWW: false, removeTrailingSlash: true, removeQueryParameters: [/^utm_/, /^fbclid$/] });
  } catch (e) {
    return link;
  }
}

async function upsertScholarship(payload) {
  // payload: { title, link, summary, source, scrapedAt }
  const normalizedUrl = normalize(payload.link || '');
  const doc = Object.assign({}, payload, { normalizedUrl, scrapedAt: payload.scrapedAt || new Date() });
  try {
    if (normalizedUrl) {
      const res = await Scholarship.findOneAndUpdate({ normalizedUrl }, doc, { upsert: true, new: true, setDefaultsOnInsert: true });
      return res;
    }
    // fallback: insert new doc if no link
    const created = await Scholarship.create(doc);
    return created;
  } catch (err) {
    // handle duplicate key race conditions
    logger.warn('Upsert failed, retrying find: %s', err.message);
    const found = await Scholarship.findOne({ normalizedUrl });
    if (found) return found;
    throw err;
  }
}

module.exports = { normalize, upsertScholarship };
