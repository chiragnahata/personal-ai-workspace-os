const mongoose = require('mongoose');
const debug = require('debug')('sc2:db');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || '';
let connected = false;

async function connect() {
  if (!MONGODB_URI) {
    debug('No MONGODB_URI configured; skipping Mongo connection');
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    connected = true;
    debug('MongoDB connected');
  } catch (err) {
    connected = false;
    console.error('MongoDB connection error:', err.message);
  }
}

connect();

module.exports = { mongoose, connect, isConnected: () => connected };
