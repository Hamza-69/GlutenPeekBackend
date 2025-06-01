const mongoose = require('mongoose')

  const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      minLength: 3
    },
    bio: String,
    pfp: {
      type: String,
      default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 
        'Please fill a valid email address.'
      ]
    },
    passwordHash: {
      type: String,
      required: true
    },

  }, {
    toJSON: { virtuals: true, 
    transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
  },
    toObject: { virtuals: true }
  })

userSchema.virtual('days', {
  ref: 'Day',
  localField: '_id',
  foreignField: 'userId',
  justOne: false
});


userSchema.set('toJSON', {
  
})

module.exports = mongoose.model('User', userSchema)