const db = require('./lib/db');
const storage = require('./lib/storage');
const Scholarship = require('./models/scholarship');

async function migrate() {
  if (!db.isConnected()) {
    console.error('MongoDB not connected. Set MONGODB_URI in .env and try again.');
    process.exit(1);
  }

  const items = storage.readStore();
  if (!items || items.length === 0) {
    console.log('No items to migrate');
    process.exit(0);
  }

  const docs = items.map(i => ({
    title: i.title || 'Untitled',
    link: i.link,
    summary: i.summary,
    source: i.source,
    scrapedAt: i.scrapedAt ? new Date(i.scrapedAt) : new Date()
  }));

  try {
    await Scholarship.insertMany(docs);
    console.log(`Migrated ${docs.length} items to MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

migrate();
