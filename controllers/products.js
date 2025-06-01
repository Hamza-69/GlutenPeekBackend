const productRouter = require('express').Router()
const Product = require('./../models/product')

productRouter.post('/', async (request, response, next) => {
  try {
    const { name, ingredients, pictureUrl, barcode } = request.body // Use const
    const product = new Product({
      barcode,
      name,
      ingredients,
      pictureUrl
    })
    const savedProduct = await product.save()
    response.status(201).json(savedProduct) // Changed to 201
  } catch (error) {
    next(error)
  }
})

productRouter.get('/:barcode', async (request, response, next) => {
  try {
    const barcode = parseInt(request.params.barcode, 10)
    // Changed to findOne, and ensure product is an object or null, not an array
    const product = await Product.findOne({ barcode }).populate([{ path: 'status' }, { path: 'symptoms' }, { path: 'claims' }])
    if (!product) { // Check if product is null (findOne returns null if not found)
      return response.status(404).json({ error: 'Product not found' })
    }
    response.status(200).json(product)
  } catch (error) {
    next(error)
  }
})

module.exports = productRouter