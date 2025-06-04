const userRouter = require('express').Router()
const User = require('./../models/user')
const bcrypt = require('bcrypt')
const { tokenExtractor, userExtractor } = require('../utils/middleware')
const { calculateStreak } = require('../utils/streakCalculator') // Import calculateStreak

userRouter.get('/', tokenExtractor, userExtractor, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'Unauthorized: User not available' })
  }
  const userId = request.user.id // Or request.user._id, depending on preference
  const userObject = await request.user.toJSON()
  userObject.streak = await calculateStreak(userId)
  response.status(200).json(userObject)
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

    if (!user) {
      return response.status(404).json({ error: 'User not found.' })
    }

    // Return only public information
    response.status(200).json({
      name: user.name,
      pfp: user.pfp,
      bio: user.bio,
      // Optionally, you might want to send counts for followers/following
      // followersCount: user.followers.length,
      // followingCount: user.following.length,
    })
  } catch (error) {
    // If the ID format is invalid, Mongoose might throw an error
    if (error.kind === 'ObjectId') {
      return response.status(404).json({ error: 'User not found (invalid ID format).' })
    }
    next(error)
  }
}

// Update user settings
userRouter.patch('/settings', tokenExtractor, userExtractor, async (request, response, next) => {
  try {
    if (!request.user) {
      // This check is technically redundant if userExtractor does its job, but good for safety.
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }

    const userId = request.user.id
    const { theme, telegram_notifications, telegram_number } = request.body

    // Fetch the user to ensure we're working with the latest document
    // request.user is from the token, might be slightly stale if updated elsewhere
    const user = await User.findById(userId)
    if (!user) {
      // Should not happen if token is valid and user exists
      return response.status(404).json({ error: 'User not found.' })
    }

    let changesMade = false;

    // Update theme if provided and valid
    if (theme !== undefined) {
      if (typeof theme !== 'boolean') {
        return response.status(400).json({ error: 'Invalid theme value. Must be true or false.' })
      }
      user.settings.theme = theme
      changesMade = true;
    }

    // Update telegram_notifications if provided and valid
    if (telegram_notifications !== undefined) {
      if (typeof telegram_notifications !== 'boolean') {
        return response.status(400).json({ error: 'Invalid telegram_notifications value. Must be true or false.' })
      }
      user.settings.telegram_notifications = telegram_notifications
      changesMade = true;
    }

    // Update telegram_number if provided (allow string, null, or empty string to clear)
    if (telegram_number !== undefined) {
      if (typeof telegram_number !== 'string' && telegram_number !== null) {
         // Allow null to unset, but if not null, must be string
        return response.status(400).json({ error: 'Invalid telegram_number value. Must be a string or null.' })
      }
      // If an empty string is passed, Mongoose will store it as such.
      // If null is passed, Mongoose will remove the field if there's no default, or use default.
      // In our schema, telegram_number is just `type: String`, so null will likely remove it or store as null.
      user.settings.telegram_number = telegram_number === "" ? null : telegram_number; // Store empty string as null
      changesMade = true;
    }

    if (!user.settings) { // Should be initialized by mongoose default
        user.settings = {};
    }


    if (changesMade) {
      await user.save() // Save the user document
    }

    // Fetch the potentially updated user again to ensure settings are correctly populated for toJSON()
    const userForResponse = await User.findById(userId)
    const userObject = userForResponse.toJSON()
    userObject.streak = await calculateStreak(userId)
    response.status(200).json(userObject)
  } catch (error) {
    next(error)
  }
})

const updateUserProfile = async (request, response, next) => {
  try {
    if (!request.user) {
      return response.status(401).json({ error: 'Unauthorized: User not available' })
    }
    const userId = request.user.id
    const user = await User.findById(userId)

    if (!user) {
      return response.status(404).json({ error: 'User not found.' }) // Should not happen
    }

    const { name, email, password, pfp, bio } = request.body
    let changesMade = false

    // Name Update
    if (name !== undefined && name !== user.name) {
      if (name.length < 3) {
        return response.status(400).json({ error: 'Name must be at least 3 characters long.' })
      }
      user.name = name
      changesMade = true
    }

    // Email Update
    if (email !== undefined && email !== user.email) {
      const emailRegex = /^(([^<>()[\]\\.,:\s@']+(\.[^<>()[\]\\.,:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      if (!emailRegex.test(email)) {
        return response.status(400).json({ error: 'Invalid email format.' })
      }
      const existingUserWithEmail = await User.findOne({ email: email })
      if (existingUserWithEmail && existingUserWithEmail._id.toString() !== userId) {
        return response.status(400).json({ error: 'Email is already in use.' })
      }
      user.email = email
      changesMade = true
    }

    // PFP Update
    if (pfp !== undefined && pfp !== user.pfp) {
      // Optional: Add URL validation for pfp if needed
      user.pfp = pfp
      changesMade = true
    }

    // Bio Update
    if (bio !== undefined && bio !== user.bio) {
      user.bio = bio
      changesMade = true
    }

    // Password Update
    if (password !== undefined) {
      if (password.length < 8) { // Consistent with user creation
        return response.status(400).json({ error: 'Password must be at least 8 characters long.' })
      }
      const saltRounds = 10
      user.passwordHash = await bcrypt.hash(password, saltRounds)
      changesMade = true
    }

    if (changesMade) {
      await user.save() // Save the user document
    }

    // Fetch the potentially updated user again to ensure all fields are fresh
    const userForResponse = await User.findById(userId)
    const userObject = userForResponse.toJSON()
    userObject.streak = await calculateStreak(userId)
    response.status(200).json(userObject)
  } catch (error) {
    // Handle potential errors like duplicate key if email check somehow fails before save
    if (error.name === 'MongoServerError' && error.code === 11000 && error.keyValue && error.keyValue.email) {
      return response.status(400).json({ error: 'Email is already in use (caught by database).' });
    }
    next(error)
  }
}

// Add the new updateUserProfile to the router for the authenticated user
userRouter.patch('/profile', tokenExtractor, userExtractor, updateUserProfile)

module.exports = { userRouter, getPublicUserProfile, updateUserProfile }