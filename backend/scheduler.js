// Scheduler skeleton - disabled by default
// This file can be extended to run scrapers periodically using node-cron or Bull + Redis.

const logger = require('./lib/logger');
const { runSource } = require('./scrapers');

async function runAll() {
  logger.info('Scheduler run started');
  // Example: runSource('nsp', { expand: 0, store: false })
}

module.exports = { runAll };
