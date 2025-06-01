const mongoose = require('mongoose')

const symptomSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  dayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Day',
    required: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
  }, 
  severity: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    required: true
  }
}, {
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    } 
  }
})


module.exports = mongoose.model('Symptom', symptomSchema)
