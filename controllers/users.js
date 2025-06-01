const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')

userRouter.get('/', async (request, response) => {
  response.json(await request.user.toJSON())
})

userRouter.post('/', async (request, response) => {
  let { name, email, bio, pfp, password } = request.body

  if (!password) {
    return response.status(400).json({ error: 'password missing' })
  }
  else if (password.length < 8) {
    return response.status(400).json({ error: 'password must be at least 8 characters long' })
  }
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$.%^&*]).{8,}$/.test(password)) {
    return response.status(400).json({ error: 'password must contain at least one lowercase letter, one uppercase letter, one number and one special character' })
  }
  else if (!name) {
    return response.status(400).json({ error: 'name missing' })
  }
  else if (name.length < 3) {
    return response.status(400).json({ error: 'name must be at least 3 characters long' })
  }
  else if (!email) {
    return response.status(400).json({ error: 'email missing' })
  }
  else if (!/^(([^<>()[\]\\.,:\s@"]+(\.[^<>()[\]\\.,:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(email)) {
    return response.status(400).json({ error: 'email is not valid' })
  }

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