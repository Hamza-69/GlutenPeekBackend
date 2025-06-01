const productRouter = require('express').Router()
const Product = require('./../models/product')

productRouter.post('/', async (request, response) => {
  let { name, ingredients, pictureUrl, barcode } = request.body
  const product = new Product({
    barcode,
    name,
    ingredients,
    pictureUrl
  })
  const savedProduct = await product.save()
  response.json(savedProduct)
})

productRouter.get('/:id', async (request, response) => {
  const product = await Product.find({ barcode: request.params.id }).populate([{ path: 'status' }, { path: 'symptoms' }, { path: 'claims' }])
  if (!product) return response.status(404).json({ error: 'Product not found' })
  response.json(product)
})

module.exports = productRouter