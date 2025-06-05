// scanRouter.js
const scanRouter = require('express').Router();
const Scan = require('./../models/scan'); // Your Scan model
const Product = require('./../models/product'); // Your Product model
const Status = require('./../models/status'); // Your Status model
const Symptom = require('./../models/symptom'); // Your Symptom model
const mongoose = require('mongoose');

// POST '/' route (you already have this)
scanRouter.post('/', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' });
    }
    const { productBarcode, date } = request.body;

    // Basic validation
    if (!productBarcode || !date) {
      return response.status(400).json({ error: 'Missing productBarcode or date' });
    }

    const scan = new Scan({
      productBarcode,
      userId: request.user._id,
      date: new Date(date), // Ensure date is a Date object
      // symptoms array will be populated when user reports symptoms for this scan
    });
    const savedScan = await scan.save();
    response.status(201).json(savedScan);
  } catch (error) {
    next(error);
  }
});

// Helper function to map Status model to frontend productStatus
const mapProductStatus = (productStatusDoc) => {
  if (!productStatusDoc) {
    return { level: 3, description: 'Status unknown' }; // Default if no status found
  }
  // This logic needs to be tailored to your specific business rules
  // Example:
  if (productStatusDoc.status === false) { // e.g., contains gluten
    return { level: 1, description: productStatusDoc.explanation || 'Not suitable for consumption' };
  }
  if (productStatusDoc.explanation && productStatusDoc.explanation.toLowerCase().includes('trace')) {
    return { level: 3, description: productStatusDoc.explanation };
  }
  if (productStatusDoc.status === true) {
    return { level: 5, description: productStatusDoc.explanation || 'Certified safe for consumption' };
  }
  return { level: 4, description: productStatusDoc.explanation || 'Generally safe' };
};

// GET '/' route for recent scans with cursor pagination
scanRouter.get('/', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' });
    }

    const userId = request.user._id;
    const limit = parseInt(request.query.limit, 10) || 10;
    const cursor = request.query.cursor; // This will be the _id of the last item from the previous page

    const query = { userId };

    if (cursor) {
      // Assuming _id is somewhat chronological or use date if more reliable
      // For _id based cursor, fetching items "older" than the cursor
      query._id = { $lt: new mongoose.Types.ObjectId(cursor) };
    }

    const scans = await Scan.find(query)
      .sort({ date: -1, _id: -1 }) // Sort by date descending, then _id descending for tie-breaking
      .limit(limit)
      .populate({
        path: 'symptoms', // Path in Scan model
        model: Symptom,   // Explicitly provide Symptom model
        select: 'symptoms date' // Select fields from Symptom doc, 'symptoms' here is the Map
      })
      .lean(); // Use .lean() for better performance as we are transforming data

    const formattedScans = [];

    for (const scan of scans) {
      // 1. Fetch Product Details
      const productData = await Product.findOne({ barcode: scan.productBarcode })
        .select('name pictureUrl')
        .lean();

      // 2. Fetch Product Status (latest for the product)
      const productStatusData = await Status.findOne({ productBarcode: scan.productBarcode })
        .sort({ date: -1 })
        .lean();
      const productStatus = mapProductStatus(productStatusData);

      // 3. Format Reported Symptoms
      let reportedSymptoms = [];
      if (scan.symptoms && scan.symptoms.length > 0) {
        scan.symptoms.forEach(symptomDoc => {
          if (symptomDoc.symptoms instanceof Map) { // Mongoose Map
            for (const [name, severity] of symptomDoc.symptoms) {
              reportedSymptoms.push({ name, severity: Number(severity) });
            }
          } else if (typeof symptomDoc.symptoms === 'object' && symptomDoc.symptoms !== null) { // Plain object from .lean()
             for (const name in symptomDoc.symptoms) {
                reportedSymptoms.push({ name, severity: Number(symptomDoc.symptoms[name]) });
            }
          }
        });
      }
      // Remove duplicates by name, keeping the highest severity (optional, depends on desired behavior)
      const uniqueSymptoms = reportedSymptoms.reduce((acc, current) => {
        const existing = acc.find(item => item.name === current.name);
        if (existing) {
          if (current.severity > existing.severity) {
            existing.severity = current.severity;
          }
        } else {
          acc.push(current);
        }
        return acc;
      }, []);


      formattedScans.push({
        id: scan._id.toString(),
        date: scan.date.toISOString(),
        product: productData ? { name: productData.name, pictureUrl: productData.pictureUrl } : { name: 'Unknown Product', pictureUrl: '/placeholder-product.jpg' },
        productStatus: productStatus,
        reportedSymptoms: uniqueSymptoms,
      });
    }

    let nextCursor = null;
    if (formattedScans.length === limit) {
      nextCursor = formattedScans[formattedScans.length - 1].id;
    }

    response.json({
      data: formattedScans,
      nextCursor: nextCursor,
    });

  } catch (error) {
    console.error("Error fetching scans:", error);
    next(error);
  }
});

module.exports = scanRouter;