const postsRouter = require('express').Router()
const Post = require('./../models/post')

postsRouter.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('comments')
    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    res.status(200).json(post)
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
    const post = new Post({
      userId: req.user._id,
      postText,
      mediaUrls
    })
    const savedPost = await post.save()
    res.status(201).json(savedPost)
  } catch (error) {
    next(error)
  }
})

module.exports = postsRouter