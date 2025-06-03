const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')
const { tokenExtractor, userExtractor } = require('../utils/middleware')

userRouter.get('/', tokenExtractor, userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'Unauthorized: User not available' })
  }
  response.status(200).json(await request.user.toJSON())
})

userRouter.post('/', async (request, response, next) => {
  const { name, email, bio, pfp, password } = request.body

  if (!password) {
    return response.status(400).json({ error: 'Password is required' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = new User({
      name,
      email,
      bio, // Mongoose will use default if bio is undefined
      pfp,  // Mongoose will use default if pfp is undefined
      passwordHash
    })

    const savedUser = await newUser.save()
    response.status(201).json(savedUser)
  } catch (error) {
    next(error) // Pass errors to the centralized error handler
  }
})

module.exports = userRouter