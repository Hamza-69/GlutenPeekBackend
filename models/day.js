const mongoose = require('mongoose')

const daySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
}, {
  toJSON: { virtuals: true,
    transform(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.__v
      return ret
    }
  },
  toObject: { virtuals: true }
})

daySchema.virtual('scans', {
  ref: 'Scan',
  localField: '_id',
  foreignField: 'dayId',
  justOne: false
})

daySchema.virtual('symptoms', {
  ref: 'Symptom',
  localField: '_id',
  foreignField: 'dayId',
  justOne: false
})

module.exports = mongoose.model('Day', daySchema)
