// scms-api/models/Counter.js
// (CRID-01) New model to handle atomic, sequential CR numbers
const mongoose = require('mongoose');

/**
 * (CRID-02)
 * This schema stores a single sequence counter for each year.
 * The _id will be something like 'cr_number_2025'.
 * The 'seq' field will be atomically incremented.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);