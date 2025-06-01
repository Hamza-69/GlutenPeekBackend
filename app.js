const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const env = require('./utils/config')
const middleware = require('./utils/middleware')
const userRouter = require('./controllers/users')
const loginRouter = require('./controllers/login')
const productRouter = require('./controllers/products')
const scanRouter = require('./controllers/scans')
const claimRouter = require('./controllers/claims')
const dayRouter = require('./controllers/days')
const symptomRouter = require('./controllers/symptoms')

const app = express()

const mongoUrl = env.MONGODB_URI
mongoose.set('strictQuery', false)

mongoose.connect(mongoUrl).then(() => {
  console.log('connected to MongoDB')
}).catch((error) => {
  console.error('error connecting to MongoDB:', error.message)
})

morgan.token('body', req => {
  return JSON.stringify(req.body)
})

app.use(morgan(':method :url :status :res[content-length] :response-time ms :body'))
app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
  res.send('Welcome to GlutenPeek Api!')
})
app.use('/api/login', loginRouter)
app.use('/api/users', userRouter)

app.use(middleware.tokenExtractor, middleware.userExtractor, middleware.dayExtractor)
app.use('/api/products', productRouter)
app.use('/api/scans', scanRouter)
app.use('/api/claims', claimRouter)
app.use('/api/days', dayRouter)
app.use('/api/symptoms', symptomRouter)

app.use(middleware.errorHandler, middleware.unknownEndpoint)

module.exports = app