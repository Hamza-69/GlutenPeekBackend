const claimsRouter = require('express').Router()
const Claim = require('./../models/claim')

claimsRouter.get('/', async (req, res) => {
  res.json(Claim.find({}))
})

claimsRouter.get('/:id', async (req, res) => {
  res.status(200).json(Claim.find({ userId: req.params.id }))
})

claimsRouter.post('/', async (req, res) => {
  const claim = new Claim(req.body)
  const savedClaim = await claim.save()
  res.status(201).json(savedClaim)
})

module.exports = claimsRouter