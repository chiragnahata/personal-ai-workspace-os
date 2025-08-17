const { Schema, model } = require('mongoose');

const ScholarshipSchema = new Schema({
  title: { type: String, required: true },
  link: { type: String },
  normalizedUrl: { type: String, index: true },
  summary: { type: String },
  source: { type: String },
  scrapedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Sparse unique index on normalizedUrl to avoid duplicate entries when link exists
ScholarshipSchema.index({ normalizedUrl: 1 }, { unique: true, sparse: true });

module.exports = model('Scholarship', ScholarshipSchema);
