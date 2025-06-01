const scanRouter = require('express').Router()
const Scan = require('./../models/scan')

scanRouter.post('/', async (request, response) => {
  let { productBarcode } =  request.body
  const scan = new Scan({
    productBarcode,
    userId: request.user._id,
    dayId: request.day._id
  })
  const savedScan = await scan.save()
  response.status(201).json(savedScan)
})

module.exports = scanRouter