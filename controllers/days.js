const dayRouter = require('express').Router()
const Day = require('./../models/day')

dayRouter.get('/:nb', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const nb = parseInt(request.params.nb, 10)
    const userId = request.user._id

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const dateList = []
    for (let i = nb - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      dateList.push(d)
    }

    const startDate = dateList[0]
    const endDate = dateList[dateList.length - 1]

    const realDays = await Day.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate([{ path: 'scans' }, { path: 'symptoms' }])
      .lean()

    const dayMap = new Map(
      realDays.map(day => [new Date(day.date).toISOString().split('T')[0], day])
    )

    const results = dateList.map(date => {
      const key = date.toISOString().split('T')[0]
      const existing = dayMap.get(key)
      return existing || {
        date,
        scans: [],
        symptoms: [],
        userId,
        placeholder: true,
      }
    })

    response.json(results)
  } catch (error) {
    next(error)
  }
})

module.exports = dayRouter
