const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')
const { tokenExtractor, userExtractor } = require('../utils/middleware')
const { calculateStreak } = require('../utils/streakCalculator') // Import calculateStreak

// Get authenticated user's own profile
userRouter.get('/me', tokenExtractor, userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'Unauthorized: User not available' })
  }
  const userId = request.user.id // Or request.user._id, depending on preference
  const userObject = await request.user.toJSON()
  userObject.streak = await calculateStreak(userId)
  response.status(200).json(userObject)
})

// Search users with pagination (public route)
userRouter.get('/search', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10
    const cursor = req.query.cursor
    const searchQuery = req.query.q

    const queryCriteria = {}
    if (searchQuery) {
      queryCriteria.name = { $regex: searchQuery, $options: 'i' }
    }

    const sortCriteria = { name: 1, _id: 1 } // Sort by name (asc), then _id (asc)

    if (cursor) {
      // Fetch only name and _id for the cursor user, as these are needed for query logic
      const cursorUser = await User.findById(cursor).select('name _id').lean()
      if (!cursorUser) {
        return res.status(400).json({ error: 'Invalid cursor' })
      }
      queryCriteria.$or = [
        { name: { $gt: cursorUser.name } },
        { name: cursorUser.name, _id: { $gt: cursorUser._id } }
      ]
    }

    // Select only public fields for the search results
    const users = await User.find(queryCriteria)
      .sort(sortCriteria)
      .limit(limit + 1)
      .select('name pfp bio _id') // _id is needed for nextCursor and toJSON will map it to id

    let nextCursor = null
    if (users.length > limit) {
      nextCursor = users[limit - 1]._id.toString()
      users.pop() // Remove the extra item
    }

    // Ensure toJSON is called for each user to apply transformations (e.g., _id to id, remove passwordHash)
    const publicUsers = users.map(user => user.toJSON())

    res.status(200).json({ users: publicUsers, nextCursor })
  } catch (error) {
    next(error)
  }
})

userRouter.post('/', async (request, response, next) => {
  const { name, email, bio, pfp, password } = request.body

  if (!password || password.length < 8) {
    return response.status(400).json({ error: 'Password is required and must be at least 8 characters long' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = new User({
      name,
      email,
      bio, // Mongoose will use default if bio is undefined
      pfp,  // Mongoose will use default if pfp is undefined
      passwordHash
    })

    const savedUser = await newUser.save()
    response.status(201).json(savedUser)
  } catch (error) {
    next(error) // Pass errors to the centralized error handler
  }
})

// Follow a user
userRouter.post('/:id/follow', tokenExtractor, userExtractor, async (request, response, next) => {
  try {
    const userIdToFollow = request.params.id
    const currentUserId = request.user.id

    if (userIdToFollow === currentUserId) {
      return response.status(400).json({ error: 'Users cannot follow themselves.' })
    }

    const currentUser = await User.findById(currentUserId)
    const userToFollow = await User.findById(userIdToFollow)

    if (!currentUser || !userToFollow) {
      return response.status(404).json({ error: 'User not found.' })
    }

    // Add to following list if not already there
    if (!currentUser.following.includes(userIdToFollow)) {
      currentUser.following.push(userIdToFollow)
    }

    // Add to followers list if not already there
    if (!userToFollow.followers.includes(currentUserId)) {
      userToFollow.followers.push(currentUserId)
    }

    await currentUser.save()
    await userToFollow.save()

    response.status(200).json({ message: 'User followed successfully.', user: await currentUser.toJSON() })
  } catch (error) {
    next(error)
  }
})

// Unfollow a user
userRouter.post('/:id/unfollow', tokenExtractor, userExtractor, async (request, response, next) => {
  try {
    const userIdToUnfollow = request.params.id
    const currentUserId = request.user.id

    const currentUser = await User.findById(currentUserId)
    const userToUnfollow = await User.findById(userIdToUnfollow)

    if (!currentUser || !userToUnfollow) {
      return response.status(404).json({ error: 'User not found.' })
    }

    // Remove from following list
    currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToUnfollow)

    // Remove from followers list
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId)

    await currentUser.save()
    await userToUnfollow.save()

    response.status(200).json({ message: 'User unfollowed successfully.' })
  } catch (error) {
    next(error)
  }
})

const getPublicUserProfile = async (request, response, next) => {
  try {
    const userId = request.params.id
    const user = await User.findById(userId)
      .populate('followers', 'id name pfp bio following followers')
      .populate('following', 'id name pfp bio following followers')
      .populate({
        path: 'posts',
        populate: [
          {
            path: 'userId',
            select: 'id name pfp bio following followers'
          },
          {
            path: 'likes',
            select: 'id name pfp bio following followers'
          },
          {
            path: 'comments',
            populate: {
              path: 'userId',
              select: 'id name pfp bio following followers'
            }
          }
        ]
      })

    if (!user) {
      return response.status(404).json({ error: 'User not found.' })
    }

    // Return public information with all populated data
    response.status(200).json({
      id: user.id,
      name: user.name,
      pfp: user.pfp,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    })
  } catch (error) {
    // If the ID format is invalid, Mongoose might throw an error
    if (error.kind === 'ObjectId') {
      return response.status(404).json({ error: 'User not found (invalid ID format).' })
    }
    next(error)
  }
}

const updateUserProfile = async (request, response, next) => {
  try {
    if (!request.user) {
      return response.status(401).json({ error: 'Unauthorized: User not available' });
    }

    const userId = request.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return response.status(404).json({ error: 'User not found.' });
    }

    const {
      name,
      email,
      password,
      pfp,
      bio,
      telegram_notifications,
      telegram_number,
      theme
    } = request.body;

    let changesMade = false;

    // Name
    if (name !== undefined && name !== user.name) {
      if (name.length < 3) {
        return response.status(400).json({ error: 'Name must be at least 3 characters long.' });
      }
      user.name = name;
      changesMade = true;
    }

    // Email
    if (email !== undefined && email !== user.email) {
      const emailRegex = /^(([^<>()[\]\\.,:\s@']+(\.[^<>()[\]\\.,:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!emailRegex.test(email)) {
        return response.status(400).json({ error: 'Invalid email format.' });
      }
      const existingUserWithEmail = await User.findOne({ email });
      if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userId) {
        return response.status(400).json({ error: 'Email is already in use.' });
      }
      user.email = email;
      changesMade = true;
    }

    // Password
    if (password !== undefined) {
      if (password.length < 8) {
        return response.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }
      const saltRounds = 10;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
      changesMade = true;
    }

    // PFP
    if (pfp !== undefined && pfp !== user.pfp) {
      user.pfp = pfp;
      changesMade = true;
    }

    // Bio
    if (bio !== undefined && bio !== user.bio) {
      user.bio = bio;
      changesMade = true;
    }

    // Telegram Notifications
    if (telegram_notifications !== undefined) {
      if (!user.settings) user.settings = {};
      user.settings.telegram_notifications = telegram_notifications;
      changesMade = true;
    }

    if (telegram_number !== undefined) {
      if (!user.settings) user.settings = {};
      user.settings.telegram_number = telegram_number;
      changesMade = true;
    }

    if (theme !== undefined) {
      if (!user.settings) user.settings = {};
      user.settings.theme = theme;
      changesMade = true;
    }

    if (changesMade) {
      await user.save();
    }

    const updatedUser = await User.findById(userId);
    const userObject = updatedUser.toJSON();
    userObject.streak = await calculateStreak(userId);

    response.status(200).json(userObject);
  } catch (error) {
    if (
      error.name === 'MongoServerError' &&
      error.code === 11000 &&
      error.keyValue?.email
    ) {
      return response.status(400).json({ error: 'Email is already in use (caught by database).' });
    }
    next(error);
  }
};

// Add the new updateUserProfile to the router for the authenticated user
userRouter.patch('/profile', tokenExtractor, userExtractor, updateUserProfile)

module.exports = { userRouter, getPublicUserProfile, updateUserProfile }