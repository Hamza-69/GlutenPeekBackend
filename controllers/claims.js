const claimsRouter = require('express').Router()
const Claim = require('./../models/claim')
const Product = require('./../models/product')

claimsRouter.get('/', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required to view all claims. Admin role might be necessary.' });
    }
    const claims = await Claim.find({})
    res.json(claims)
  } catch (error) {
    next(error)
  }
})

claimsRouter.get('/:id', async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You are not authorized to view these claims.' })
    }
    const claims = await Claim.find({ userId: req.params.id })
    res.status(200).json(claims)
  } catch (error) {
    next(error)
  }
})

claimsRouter.post('/', async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const { productBarcode, explanation, mediaProofUrl } = req.body // Destructure after user check

    const productExists = await Product.findOne({ barcode: productBarcode });
    if (!productExists) {
      return res.status(404).json({ error: 'Product with the given barcode not found.' });
    }

    const claim = new Claim({
      userId: req.user._id,
      productBarcode,
      explanation,
      mediaProofUrl,
      status: false // Explicitly setting default, though schema might handle it
    })
    const savedClaim = await claim.save()
    res.status(201).json(savedClaim)
  } catch (error) {
    next(error)
  }
})

module.exports = claimsRouter