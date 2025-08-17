const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const scrapeRouter = require('./scrapers/scholarshipScraper');
const scholarshipsRouter = require('./routes/scholarships');

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' });
});

// Mount scraper router
app.use('/scrape', scrapeRouter);

// Mount scholarships API
app.use('/api/scholarships', scholarshipsRouter);

app.listen(port, () => {
  console.log(`SC2 backend listening on port ${port}`);
});
