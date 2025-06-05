const Scan = require('../models/scan')
const Symptom = require('../models/symptom')
const Product = require('../models/product') // ← new import

const dayRouter = require('express').Router()

dayRouter.get('/', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response
        .status(401)
        .json({ error: 'Unauthorized: User not available' })
    }
    const userId = request.user._id

    const { startdate, enddate } = request.query
    if (!startdate || !enddate) {
      return response
        .status(400)
        .json({ error: 'startdate and enddate query parameters are required.' })
    }

    const startDate = new Date(startdate)
    const endDate = new Date(enddate)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return response
        .status(400)
        .json({ error: 'Invalid startdate or enddate format.' })
    }
    if (startDate > endDate) {
      return response
        .status(400)
        .json({ error: 'Start date must be before end date' })
    }

    // Build an array of Date objects from startDate through endDate (inclusive)
    const dateList = []
    const curr = new Date(startDate)
    while (curr <= endDate) {
      dateList.push(new Date(curr))
      curr.setDate(curr.getDate() + 1)
    }

    // “< end of day after endDate” for Mongo queries
    const nextDay = new Date(endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    nextDay.setHours(0, 0, 0, 0)

    // Fetch all symptoms in [startDate, nextDay)
    const realSymptoms = await Symptom.find({
      userId,
      date: { $gte: startDate, $lt: nextDay },
    })

    // Fetch all scans in [startDate, nextDay)
    const realScans = await Scan.find({
      userId,
      date: { $gte: startDate, $lt: nextDay },
    }).lean() // .lean() so we can attach “product” manually

    // If there are any scans, collect their barcodes and bulk‐load Products
    let productMap = {}
    if (realScans.length > 0) {
      const uniqueBarcodes = [
        ...new Set(realScans.map((scan) => scan.productBarcode)),
      ]

      const products = await Product.find({
        barcode: { $in: uniqueBarcodes },
      }).select('barcode name pictureUrl')
      // Build a map: { barcode → { name, pictureUrl, barcode } }
      productMap = products.reduce((acc, prod) => {
        acc[prod.barcode] = {
          name: prod.name,
          pictureUrl: prod.pictureUrl,
          barcode: prod.barcode,
        }
        return acc
      }, {})
    }

    // Attach “product” field to each scan
    const scansWithProduct = realScans.map((scan) => {
      const productInfo = productMap[scan.productBarcode] || null
      return {
        id: scan._id.toString(),
        productBarcode: scan.productBarcode,
        date: scan.date,
        // Attach product if found; otherwise null
        product: productInfo,
        // (preserve any other fields on scan if needed— e.g. status, etc.)
        ...scan,
      }
    })

    // Finally, group by date string ("YYYY-MM-DD") into an array of day‐objects
    const realDays = dateList.map((dateObj) => {
      const key = dateObj.toISOString().split('T')[0]

      const scansForThisDay = scansWithProduct.filter(
        (s) => s.date.toISOString().split('T')[0] === key
      )
      const symptomsForThisDay = realSymptoms.filter(
        (s) => s.date.toISOString().split('T')[0] === key
      )

      return {
        date: dateObj,       // e.g. "2025-06-03T00:00:00.000Z"
        scans: scansForThisDay,
        symptoms: symptomsForThisDay.map((sym) => ({
          id: sym._id.toString(),
          productBarcode: sym.productBarcode,
          date: sym.date,
          symptoms: Object.fromEntries(sym.symptoms), // convert Map → plain object
        })),
      }
    })

    return response.json(realDays)
  } catch (error) {
    next(error)
  }
})

module.exports = dayRouter
