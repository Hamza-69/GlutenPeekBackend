const symptomRouter = require('express').Router()
const Symptom = require('./../models/symptom')

symptomRouter.post('/', async (request, response) => {
  const allValues = Object.values(request.query)
  for (let i of allValues) {
    const symptom = new Symptom({
      productBarcode: i,
      userId: request.user._id,
      dayId: request.day._id,
      date: request.body.date,
      scanId: request.body.scanId,
      severity: request.body.severity
    })
    const savedSymptom = await symptom.save()
    response.status(201).json(savedSymptom)
  }
})

module.exports = symptomRouter