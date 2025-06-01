const scanRouter = require('express').Router()
const Scan = require('./../models/scan')

scanRouter.post('/', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    if (!request.day || !request.day._id) {
      console.error('Error in POST /api/scans: request.day is not available or missing _id.')
      return response.status(500).json({ error: 'Server error: Day information could not be processed.' })
    }
    const { productBarcode } =  request.body // Use const
    const scan = new Scan({
      productBarcode,
      userId: request.user._id,
      dayId: request.day._id
    })
    const savedScan = await scan.save()
    response.status(201).json(savedScan)
  } catch (error) {
    next(error)
  }
})

module.exports = scanRouter