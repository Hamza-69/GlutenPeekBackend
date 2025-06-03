const commentRouter = require('express').Router()
const Comment = require('../models/comment')

commentRouter.post('/:id', async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const { postText, mediaUrls } = req.body // Destructure after user check
    const claim = new Comment({
      userId: req.user._id,
      postText,
      mediaUrls,
      postId: req.params.id
    })
    const savedClaim = await claim.save()
    res.status(201).json(savedClaim)
  } catch (error) {
    next(error)
  }
})

module.exports = commentRouter