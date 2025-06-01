const claimsRouter = require('express').Router()
const Claim = require('./../models/claim')

claimsRouter.get('/', async (req, res, next) => {
  try {
    const claims = await Claim.find({})
    res.json(claims)
  } catch (error) {
    next(error)
  }
})

claimsRouter.get('/:id', async (req, res, next) => {
  try {
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