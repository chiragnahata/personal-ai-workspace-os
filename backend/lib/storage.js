const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) fs.writeFileSync(STORE_PATH, JSON.stringify([]), 'utf8');
}

function readStore() {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function addItem(item) {
  const arr = readStore();
  arr.push(item);
  writeStore(arr);
  return item;
}

module.exports = { readStore, writeStore, addItem, STORE_PATH };
