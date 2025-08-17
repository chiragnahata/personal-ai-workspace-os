const axios = require('axios');
const axiosRetry = require('axios-retry');
let normalizeUrl = require('normalize-url');
// normalize-url may export as default or as function; guard against non-function
if (normalizeUrl && typeof normalizeUrl !== 'function' && normalizeUrl.default && typeof normalizeUrl.default === 'function') {
  normalizeUrl = normalizeUrl.default;
}
const logger = require('../lib/logger');

const client = axios.create({
  timeout: 20000,
  headers: { 'User-Agent': 'SC2-scraper/1.0 (+https://example.com)' }
});

axiosRetry(client, { retries: 3, retryDelay: axiosRetry.exponentialDelay, retryCondition: axiosRetry.isNetworkOrIdempotentRequestError });

async function fetchUrl(url) {
  let normalized = url;
  try {
    if (typeof normalizeUrl === 'function') {
      normalized = normalizeUrl(url, { stripWWW: false, removeTrailingSlash: false });
    }
  } catch (e) {
    logger.warn('normalizeUrl failed, using raw url: %s -> %s', url, e.message);
    normalized = url;
  }
  logger.info('Fetching %s', normalized);
  const resp = await client.get(normalized);
  return resp.data;
}

module.exports = { fetchUrl };
