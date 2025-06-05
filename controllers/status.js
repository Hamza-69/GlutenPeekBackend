// routes/statusRouter.js
const statusRouter = require('express').Router();
const Status = require('./../models/status'); // Adjust path as needed
const Product = require('./../models/product'); // Adjust path as needed
// const authMiddleware = require('./../middleware/auth'); // If you have auth middleware for POST

// POST /api/statuses - Create a new status entry for a product
// For simplicity, this example doesn't include user authentication for who is POSTing.
// In a real app, you'd likely protect this route.
statusRouter.post('/', async (request, response, next) => {
  try {
    const { productBarcode, level, description } = request.body;

    if (!productBarcode || level === undefined || !description) {
      return response.status(400).json({ error: 'Missing required fields: productBarcode, level, description' });
    }

    if (typeof level !== 'number' || level < 1 || level > 5) {
        return response.status(400).json({ error: 'Invalid level: must be a number between 1 and 5.' });
    }

    // Optional: Check if product exists
    const product = await Product.findOne({ barcode: productBarcode });
    if (!product) {
      return response.status(404).json({ error: `Product with barcode ${productBarcode} not found` });
    }

    const newStatus = new Status({
      productBarcode,
      level,
      description,
      // date: new Date() // Will default to Date.now or use createdAt from timestamps
      // updatedBy: request.user ? request.user._id : null // If you have user context
    });

    const savedStatus = await newStatus.save();
    response.status(201).json(savedStatus);
  } catch (error) {
    next(error);
  }
});

// GET /api/statuses/product/:productBarcode - Get the latest status for a product
statusRouter.get('/product/:productBarcode', async (request, response, next) => {
  try {
    const productBarcode = Number(request.params.productBarcode);
    if (isNaN(productBarcode)) {
      return response.status(400).json({ error: 'Invalid product barcode format.'});
    }

    const latestStatus = await Status.findOne({ productBarcode: productBarcode })
      .sort({ date: -1, createdAt: -1 }) // Sort by effective date, then creation date
      .select('level description date createdAt') // Select specific fields
      .lean(); // Use lean for plain JS object

    if (!latestStatus) {
      // Return a default "unknown" status if no specific status is found
      // This aligns with how scanRouter handles missing status
      return response.status(200).json({
        productBarcode: productBarcode,
        level: 3, // Default "unknown" or "neutral" level
        description: 'Status information not available for this product.',
        isDefault: true
      });
    }

    response.json(latestStatus);
  } catch (error) {
    next(error);
  }
});

module.exports = statusRouter;