const productRouter = require('express').Router()
const Product = require('./../models/product')

productRouter.post('/', async (request, response) => {
  let { name, ingredients, pictureUrl } = request.body
  const product = new Product({
    name,
    ingredients,
    pictureUrl
  })
  const savedProduct = await product.save()
  response.json(savedProduct)
})

module.exports = productRouter