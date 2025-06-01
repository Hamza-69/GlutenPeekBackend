const express = require('express')
const morgan = require('morgan')
const app = express()
const mongoose = require('mongoose')
const env = require('./utils/config')
const mongoUrl = env.MONGODB_URI

mongoose.set('strictQuery', false)

mongoose.connect(mongoUrl).then(() => {
  console.log('connected to MongoDB')
}).catch((error) => {
  console.error('error connecting to MongoDB:', error.message)
})

app.use(express.json())

morgan.token('body', req => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] :response-time ms :body'))

app.get('/', (req, res) => {
  res.send('Welcome to GlutenPeek Api!')
})

module.exports = app