const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')

userRouter.get('/', async (request, response) => {
  response.status(200).json(await request.user.toJSON())
})

userRouter.post('/', async (request, response) => {
  let { name, email, bio, pfp, password } = request.body
  const passwordHash = await bcrypt.hash(password, 10)

  const userObj = {
    name,
    email,
    bio,
    pfp,
    passwordHash
  }

  // eslint-disable-next-line no-unused-vars
  const user = new User(Object.fromEntries(Object.entries(userObj).filter(([key, value]) => value)))

  const saved = await user.save()
  response.status(201).json(saved)
})

module.exports = userRouter