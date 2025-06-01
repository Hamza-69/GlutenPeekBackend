const symptomRouter = require('express').Router()
const mongoose = require('mongoose')
const Scan = require('../models/scan')
const Symptom = require('./../models/symptom')

symptomRouter.post('/', async (request, response, next) => {
  if (!request.user || !request.user._id) {
    return response.status(401).json({ error: 'Unauthorized: User not available' })
  }
  if (!request.day || !request.day._id) {
    console.error('Error in POST /api/symptoms: request.day is not available or missing _id.')
    return response.status(500).json({ error: 'Server error: Day information could not be processed.' })
  }
  if (request.body.date === undefined || request.body.severity === undefined) {
    return response.status(400).json({ error: 'Missing required fields in body: date, or severity.' })
  }

  try {
    const { date, severity } = request.body
    const allQueryValues = Object.values(request.query)

    if (!allQueryValues || allQueryValues.length === 0) {
      return response.status(400).json({ error: 'No scan id provided in query parameters.' })
    }

    const savedSymptoms = []
    for (const scanId of allQueryValues) {
      const scan = await Scan.findById(new mongoose.Types.ObjectId(scanId))

      console.log({
        userId: request.user._id,
        date: new Date(date),
        productBarcode: scan.productBarcode,
        dayId: request.day._id,
        scanId: scan._id,
        severity
      })
      const symptom = new Symptom({
        userId: request.user._id,
        date: new Date(date),
        productBarcode: scan.productBarcode,
        dayId: request.day._id,
        scanId: scan._id,
        severity
      })

      const savedSymptom = await symptom.save()
      savedSymptoms.push(savedSymptom)
    }

    if (savedSymptoms.length === 0 && allQueryValues.length > 0) {
      return response.status(400).json({ error: 'No valid symptoms created. Check barcode formats or other data.' })
    }
    response.status(201).json(savedSymptoms) // Send a single response
  } catch (error) {
    next(error)
  }
})

module.exports = symptomRouter