const loginRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

loginRouter.post('/', async (request, response) => {
  const { email, password } = request.body
  const user = await User.findOne({ email })

  const passwordCorrect = user === null
    ? false
    : await bcrypt.compare(password, user.passwordHash)

  if (!passwordCorrect) {
    return response.status(400).json({
      error: 'Invalid username or password.'
    })
  }
  const userForToken = {
    email: user.email,
    id: user._id,
  }
  const token = jwt.sign(userForToken, process.env.SECRET)
  response
    .status(200)
    .send({ token, email: user.email, name: user.name })
})

module.exports = loginRouter