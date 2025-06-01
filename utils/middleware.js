const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Day = require('../models/day')

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.startsWith('Bearer ')) {
    request.token = authorization.replace('Bearer ', '')
  }
  next()
}

const userExtractor = async (request, response, next) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET)
  request.user = await User.findById(decodedToken.id)
  next()
}

const dayExtractor = async (request, response, next) => {
  const day = await Day.findOne({ userId: request.user._id }).sort({ date: -1 })
  if (day.date !== new Date().toDateString()) {
    const newDay = new Day({
      userId: request.user._id,
      date: new Date().toDateString()
    })
    await newDay.save()
  }
  request.day = await Day.findOne({ userId: request.user._id }).sort({ date: -1 })
  next()
}

module.exports = {
  tokenExtractor,
  userExtractor,
  dayExtractor
}