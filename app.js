const express = require('express')
const morgan = require('morgan')
const app = express()

app.use(express.json())

morgan.token('body', req => {
  return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] :response-time ms :body'))

app.get('/', (req, res) => {
  res.send('Welcome to GlutenPeek Api!')
})

module.exports = app