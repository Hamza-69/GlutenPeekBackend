const symptomRouter = require('express').Router()
const Symptom = require('./../models/symptom')

symptomRouter.post('/', async (request, response, next) => {
  if (!request.user || !request.user._id) {
    return response.status(401).json({ error: 'Unauthorized: User not available' })
  }
  if (!request.day || !request.day._id) {
    console.error('Error in POST /api/symptoms: request.day is not available or missing _id.')
    return response.status(500).json({ error: 'Server error: Day information could not be processed.' })
  }
  // It's good practice to validate main body parameters if they are essential for the loop.
  // For example, if date, scanId, severity are used inside the loop from request.body:
  if (request.body.date === undefined || request.body.scanId === undefined || request.body.severity === undefined) {
    return response.status(400).json({ error: 'Missing required fields in body: date, scanId, or severity.' })
  }

  try {
    const { date, scanId, severity } = request.body // Assuming these are common for all symptoms from query
    // const productBarcodesQuery = request.query.productBarcodes; // Example: expecting ?productBarcodes=123,456 or similar

    // If productBarcodes is intended to be an array from query like ?barcodes=1&barcodes=2,
    // Express might parse it as an array if the query is `?productBarcodes=123&productBarcodes=456`
    // Or if it's a single query param with multiple values: `?barcodes=123,456` then split it.
    // For this task, let's assume `Object.values(request.query)` was intended to get all query values as potential barcodes.
    // This part remains a bit ambiguous based on original code, using Object.values as a fallback.
    const allQueryValues = Object.values(request.query)

    if (!allQueryValues || allQueryValues.length === 0) {
      return response.status(400).json({ error: 'No product barcodes provided in query parameters.' })
    }

    const savedSymptoms = []
    for (const barcodeStr of allQueryValues) { // Using allQueryValues as per original code's spirit
      const productBarcode = parseInt(barcodeStr, 10)
      if (isNaN(productBarcode)) {
        console.warn(`Invalid barcode format in query: ${barcodeStr} - skipping.`)
        continue
      }

      const symptom = new Symptom({
        productBarcode,
        userId: request.user._id,
        dayId: request.day._id,
        date: new Date(date), // Convert date string from body to Date object
        scanId,
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