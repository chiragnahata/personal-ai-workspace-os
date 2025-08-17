const nsp = require('./sources/nsp');
const buddy = require('./sources/buddy4study');

const sources = {
  nsp,
  buddy4study: buddy
};

async function runSource(sourceKey, options = {}) {
  const fn = sources[sourceKey];
  if (!fn) throw new Error('Unknown source: ' + sourceKey);
  return await fn(options);
}

module.exports = { sources, runSource };
