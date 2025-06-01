const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  barcode: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  ingredients: {
    type: [String],
    required: true
  },
  pictureUrl: {
    type: String,
    trim: true,
    required: true
  }
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

productSchema.virtual('status', {
  ref: 'Status',
  localField: '_id',
  foreignField: 'productId',
  justOne: true
})

productSchema.virtual('symptoms', {
  ref: 'Symptom',
  localField: '_id',
  foreignField: 'productId',
  justOne: false
})

productSchema.virtual('claims', {
  ref: 'Claim',
  localField: '_id',
  foreignField: 'productId',
  justOne: false
})

module.exports = mongoose.model('Product', productSchema)
