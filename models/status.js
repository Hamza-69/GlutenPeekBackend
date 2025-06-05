// models/status.js
const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  productBarcode: {
    type: Number,
    ref: 'Product', // Reference to the Product model via its barcode
    required: true,
    index: true // Index for faster queries on productBarcode
  },
  level: { // The 1-5 numeric status level
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  description: { // The textual description of the status
    type: String,
    required: true,
    trim: true
  },
  date: { // When this status record was created/became effective
    type: Date,
    default: Date.now
  },
  // Optional: To track who made the change, if you have user authentication for this
  // updatedBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User'
  // }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Status', statusSchema);