const fs = require('fs');
const path = require('path');
const scraper = require('./scrapers/scholarshipScraper');

const samplePath = path.join(__dirname, 'test-data', 'sample.html');
const html = fs.readFileSync(samplePath, 'utf8');
const result = scraper.parseHtmlString(html, 'file://' + samplePath);
console.log(JSON.stringify(result, null, 2));
