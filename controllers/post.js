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

// Like a post
postsRouter.post('/:id/like', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const postId = request.params.id
    const userId = request.user._id

    const post = await Post.findById(postId)

    if (!post) {
      return response.status(404).json({ error: 'Post not found.' })
    }

    // Add userId to likes if not already present
    if (!post.likes.includes(userId)) {
      post.likes.push(userId)
      await post.save()
    }
    // Populate user details for likes before sending response
    const populatedPost = await Post.findById(postId).populate('likes', 'name pfp')
    response.status(200).json({ message: 'Post liked successfully.', post: populatedPost })
  } catch (error) {
    next(error)
  }
})

// Unlike a post
postsRouter.post('/:id/unlike', async (request, response, next) => {
  try {
    if (!request.user || !request.user._id) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const postId = request.params.id
    const userId = request.user._id

    const post = await Post.findById(postId)

    if (!post) {
      return response.status(404).json({ error: 'Post not found.' })
    }

    // Remove userId from likes
    const initialLikeCount = post.likes.length
    post.likes = post.likes.filter(likeId => likeId.toString() !== userId.toString())

    if (post.likes.length < initialLikeCount) { // only save if a like was actually removed
      await post.save()
    }

    // Populate user details for likes before sending response
    const populatedPost = await Post.findById(postId).populate('likes', 'name pfp')
    response.status(200).json({ message: 'Post unliked successfully.', post: populatedPost })
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