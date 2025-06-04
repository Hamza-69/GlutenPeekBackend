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

// Admin: Close or update a claim's status and explanation
claimsRouter.patch('/:id/status', async (request, response, next) => {
  try {
    // 1. Authenticate and Authorize Admin
    if (!request.user) {
      return response.status(401).json({ error: 'Authentication required.' })
    }
    if (request.user.email !== 'admin@glutenpeek.com') {
      return response.status(403).json({ error: 'Forbidden: Only admins can modify claim statuses.' })
    }

    const { id: claimId } = request.params
    const { status, explanation } = request.body

    // 2. Validate input
    if (typeof status !== 'boolean') {
      return response.status(400).json({ error: 'Invalid status format. Must be true or false.' })
    }
    if (status === true && (typeof explanation !== 'string' || explanation.trim() === '')) {
      // Require explanation only if closing the claim (status: true)
      return response.status(400).json({ error: 'Explanation is required when closing a claim.' })
    }


    // 3. Find and Update Claim
    const claim = await Claim.findById(claimId)
    if (!claim) {
      return response.status(404).json({ error: 'Claim not found.' })
    }

    claim.status = status
    // Only update explanation if provided, especially useful if admin wants to reopen without changing original explanation
    // or wants to add a closing explanation.
    if (explanation !== undefined) {
        claim.explanation = explanation
    } else if (status === true && claim.explanation.trim() === '') {
        // If closing and no new explanation is provided, and old one is empty, this might be an issue.
        // However, the previous check for (status === true && explanation is empty) should catch this.
        // This is more of a safeguard or if logic changes.
    }


    const updatedClaim = await claim.save()

    // 4. Respond
    response.status(200).json(updatedClaim)

  } catch (error) {
    // Handle potential errors like invalid ObjectId for claimId
    if (error.name === 'CastError' && error.path === '_id') {
        return response.status(400).json({ error: 'Invalid claim ID format.' });
    }
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