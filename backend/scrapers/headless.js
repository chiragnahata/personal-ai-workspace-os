// Minimal headless fetcher wrapper
// Tries to use puppeteer-extra + stealth plugin if installed. If not installed, throws a helpful error.
const logger = require('../lib/logger');

async function fetchHtml(url, options = {}) {
  const timeout = options.timeout || 20000;
  let puppeteer;
  try {
    // prefer puppeteer-extra if available
    puppeteer = require('puppeteer-extra');
    try {
      const stealth = require('puppeteer-extra-plugin-stealth')();
      puppeteer.use(stealth);
    } catch (e) {
      // stealth plugin optional
    }
  } catch (e) {
    // fallback to regular puppeteer
    try {
      puppeteer = require('puppeteer');
    } catch (err) {
      const msg = 'Puppeteer is not installed. To use headless fetcher install puppeteer or puppeteer-extra.';
      logger.error(msg);
      throw new Error(msg);
    }
  }

  const launchArgs = [];
  if (options.proxy) launchArgs.push(`--proxy-server=${options.proxy}`);

  const browser = await puppeteer.launch(Object.assign({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', ...launchArgs] }, options.launchOptions || {}));
  try {
    const page = await browser.newPage();
    if (options.userAgent) await page.setUserAgent(options.userAgent);
    if (options.viewport) await page.setViewport(options.viewport);
    await page.setDefaultNavigationTimeout(timeout);
    await page.goto(url, { waitUntil: options.waitUntil || 'networkidle2', timeout });
    if (options.waitForSelector) {
      try {
        await page.waitForSelector(options.waitForSelector, { timeout: Math.min(8000, timeout) });
      } catch (e) {
        // ignore waitForSelector timeout; proceed to capture HTML
      }
    }
    const html = await page.content();
    return html;
  } finally {
    try { await browser.close(); } catch (e) { /* ignore */ }
  }
}

module.exports = { fetchHtml };
