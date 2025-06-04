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
  productBarcode: {
    type: Number,
    ref: 'Product',
    required: true
  },
  scanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan',
    required: true
  },
  symptoms: {
    type: Map,
    required: true,
  }
  // like symptoms = {"symptom1":5, "symptom2":4, "symptom3":3, "symptom4":2, "symptom5":1} it is sympotom and sevirity.
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
