const url = require('url');

function resolveUrl(base, href) {
  if (!href) return null;
  try {
    // If href looks like protocol-relative or absolute, normalize
    return new url.URL(href, base).toString();
  } catch (e) {
    return href;
  }
}

// Simple heuristic to find date-like strings (dd MMM yyyy, dd-mm-yyyy, yyyy-mm-dd, etc.)
function extractDeadline(text) {
  if (!text) return null;
  const patterns = [
    /\b(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})\b/i,
    /\b(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})\b/,
    /\b(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})\b/,
    /deadline\s*[:\-]?\s*(\d{1,2}[\s\S]{0,20}?\d{4})/i
  ];
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[1];
  }
  return null;
}

function extractEligibility(text) {
  if (!text) return null;
  // Look for keywords and short phrases like 'for students from', 'only for', 'female', 'open to'
  const m = /(?:for|only for|open to|applicable to)\s+([\s\S]{1,60}?)(?:\.|\n|$)/i.exec(text);
  if (m) return m[1].trim();
  const short = /(female|male|girls|boys|sc|st|obc|general|all categories|students)/i.exec(text);
  if (short) return short[0];
  return null;
}

module.exports = { resolveUrl, extractDeadline, extractEligibility };
// Simple sleep helper for rate-limiting
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.sleep = sleep;
