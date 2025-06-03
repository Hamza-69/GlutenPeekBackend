const statusRouter = require('express').Router()
const Status = require('./../models/status')

statusRouter.patch('/:barcode', async (req, res, next) => {
  try {
    const { status, explanation } = req.body

    const post = await Status.findOne({ productBarcode: req.params.barcode })

    if (!post) {
      return res.status(404).json({ message: 'Status not found' })
    }

    // Only update provided fields
    if (status !== undefined) post.status = status
    if (explanation !== undefined) post.explanation = explanation

    const updatedPost = await post.save()

    res.status(200).json(updatedPost)
  } catch (error) {
    next(error)
  }
})

statusRouter.post('/', async (req, res, next) => {
  try {
    const { productBarcode, status, explanation } = req.body // Destructure after user check
    const claim = new Status({
      productBarcode,
      status,
      explanation
    })
    const savedClaim = await claim.save()
    res.status(201).json(savedClaim)
  } catch (error) {
    next(error)
  }
})

module.exports = statusRouter