const Scan = require('../models/scan')
const Symptom = require('../models/symptom')

const dayRouter = require('express').Router()

dayRouter.get('/', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const userId = request.user._id

    const startDate = new Date(request.query.startdate)
    const endDate = new Date(request.query.enddate)

    if (startDate > endDate) {
      return response.status(400).json({ error: 'Start date must be before end date' })
    }

    const curr = new Date(startDate)
    const dateList = []
    while (curr <= endDate) {
      dateList.push(new Date(curr))
      curr.setDate(curr.getDate() + 1)
    }

    const realSymptoms = await Symptom.find({
      userId,
      date: { $gte: startDate, $lte: endDate.setDate(endDate.getDate() + 1) },
    })

    const realScans =  await Scan.find({
      userId,
      date: { $gte: startDate, $lte: endDate.setDate(endDate.getDate() + 1) },
    })
    console.log(realScans, realSymptoms, dateList)
    const realDays = dateList.map(date => {
      const key = date.toISOString().split('T')[0]
      return {
        date,
        scans: [realScans.filter(scan => new Date(scan.date).toISOString().split('T')[0] === key)],
        symptoms: [realSymptoms.filter(symptom => new Date(symptom.date).toISOString().split('T')[0] === key)],
        userId,
      }
    })

    response.json(realDays)
  } catch (error) {
    next(error)
  }
})

module.exports = dayRouter
