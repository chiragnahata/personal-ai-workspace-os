const cheerio = require('cheerio');
const { fetchUrl } = require('../httpClient');
const { resolveUrl, extractDeadline, extractEligibility } = require('./helpers');

module.exports = async function nspScraper(options = {}) {
  const baseUrl = options.url || 'https://scholarships.gov.in/';
  const html = await fetchUrl(baseUrl);
  const $ = cheerio.load(html);
  const listings = [];
  const expand = options.expand;

  // Try to find an "All Scholarships" link and follow it for a structured list
  let allHref = null;
  $('a').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href');
    if (!href) return;
    if (/all-?scholarship|all scholarships|all-scholarships/i.test(text) || /All-Scholarships/i.test(href)) {
      allHref = resolveUrl(baseUrl, href);
    }
  });

  if (allHref) {
    try {
      const listHtml = await fetchUrl(allHref);
      const $l = cheerio.load(listHtml);

      // Try table rows first
      $l('table tr').each((i, tr) => {
        if (i === 0) return; // skip header
        const cols = $l(tr).find('td');
        if (cols.length >= 1) {
          const title = $l(cols[0]).text().trim();
          const a = $l(cols[0]).find('a').first();
          const link = a.attr('href') ? resolveUrl(allHref, a.attr('href')) : null;
          const summary = cols.length > 1 ? $l(cols[1]).text().trim() : null;
          const lastDate = cols.length > 2 ? $l(cols[2]).text().trim() : null;
          listings.push({ title, link, summary, lastDate });
        }
      });

      // If no table rows found, try list items
      if (listings.length === 0) {
        $l('li').each((i, li) => {
          const a = $l(li).find('a').first();
          if (!a || !a.attr('href')) return;
          const title = a.text().trim();
          const link = resolveUrl(allHref, a.attr('href'));
          const body = $l(li).text().trim();
          const lastDate = extractDeadline(body) || null;
          const eligibility = extractEligibility(body) || null;
          listings.push({ title, link, lastDate, eligibility });
        });
      }
    } catch (e) {
      // fallback to homepage parsing
    }
  }

  // Search for main content links that likely point to scholarship details
  $('a').each((i, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href');
    if (!href) return;
    if (/scholarship|apply|scheme|eligibilit|sanction|application/i.test(text)) {
      const link = resolveUrl(baseUrl, href);
      listings.push({ title: text, link });
    }
  });

  // Optionally expand each listing by fetching the detail page to extract more info
  if (expand && listings.length > 0) {
    for (const item of listings) {
      try {
  if (!item.link) continue;
  const detailHtml = await fetchUrl(item.link);
        const $d = cheerio.load(detailHtml);
        const bodyText = $d('body').text();
        item.summary = $d('meta[name="description"]').attr('content') || (bodyText || '').trim().slice(0, 300);
        item.deadline = extractDeadline(bodyText) || null;
        item.eligibility = extractEligibility(bodyText) || null;
      } catch (e) {
        // ignore detail fetch failures
      }
    }
  }

  // Ensure all listing links are absolute URLs when possible
  const normalizedListings = listings.map(item => {
    try {
      return Object.assign({}, item, { link: item.link ? resolveUrl(baseUrl, item.link) : null });
    } catch (e) {
      return item;
    }
  });

  return { source: 'nsp', url: baseUrl, listings: normalizedListings };
};
