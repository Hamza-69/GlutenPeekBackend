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

productRouter.get('/:barcode', async (request, response) => {
  const barcode = parseInt(request.params.barcode, 10)
  const product = await Product.find({ barcode }).populate([{ path: 'status' }, { path: 'symptoms' }, { path: 'claims' }])
  if (!product) return response.status(404).json({ error: 'Product not found' })
  response.status(200).json(product)
})

module.exports = productRouter