const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Day = require('../models/day')

const errorHandler = (error, request, response, next) => {

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
    return response.status(400).json({ error: 'expected `email` to be unique' })
  } else if (error.name ===  'JsonWebTokenError') {
    return response.status(400).json({ error: 'token missing or invalid' })
  }
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
  next()
}

const dayExtractor = async (request, response, next) => {
  const day = await Day.findOne({ userId: request.user._id }).sort({ date: -1 })
  if (day.date !== new Date().toDateString()) {
    const newDay = new Day({
      userId: request.user._id,
      date: new Date().toDateString()
    })
    request.day = await newDay.save()
  } else {
    request.day = day
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