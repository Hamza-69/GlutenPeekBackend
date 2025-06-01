const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Day = require('../models/day')

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `email` to be unique' })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({ error: 'token missing or invalid' })
  }
  // Log unhandled errors before passing them to the default error handler
  console.error('Unhandled error in errorHandler:', error)
  next(error)
}

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
  if (!request.user) {
    return response.status(401).json({ error: 'User not found for token' })
  }
  next()
}

const dayExtractor = async (request, response, next) => {
  if (!request.user) {
    return next(new Error('User not available for day extraction. Ensure userExtractor runs first and successfully.'))
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const day = await Day.findOne({ userId: request.user._id }, {}, { sort: { 'date': -1 } })

  if (day && day.date.getTime() === today.getTime()) {
    request.day = day
  } else {
    const newDay = new Day({
      userId: request.user._id,
      date: today // Use the 'today' variable which is already set to the start of the day
    })
    request.day = await newDay.save()
  }
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

module.exports = {
  tokenExtractor,
  userExtractor,
  dayExtractor,
  unknownEndpoint,
  errorHandler
}