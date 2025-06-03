const postsRouter = require('express').Router()
const Post = require('./../models/post')

postsRouter.get('/:id', async (req, res, next) => {
  try {
    const posts = await Post.find({ _id: req.params.id })
    res.status(200).json(posts)
  } catch (error) {
    next(error)
  }
})

postsRouter.post('/', async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const { postText, mediaUrls } = req.body // Destructure after user check
    const claim = new Post({
      userId: req.user._id,
      postText,
      mediaUrls
    })
    const savedClaim = await claim.save()
    res.status(201).json(savedClaim)
  } catch (error) {
    next(error)
  }
})

module.exports = postsRouter