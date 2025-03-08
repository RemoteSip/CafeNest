const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const auth = require('../middleware/auth');
const { body, query, param, validationResult } = require('express-validator');

// Register a new user
router.post('/register', [
  body('username').notEmpty().trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  body('profile_image').optional().isURL(),
  body('bio').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if username already exists
    const existingUsername = await User.getUserByUsername(req.body.username);
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Check if email already exists
    const existingEmail = await User.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create user
    const user = await User.createUser(req.body);
    
    // Generate JWT token
    const token = auth.generateToken(user);
    
    // Return user data and token
    res.status(201).json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: user.profile_image
      },
      token
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { email, password } = req.body;
    
    // Get user by email
    const user = await User.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await User.verifyPassword(user.user_id, password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = auth.generateToken(user);
    
    // Return user data and token
    res.json({
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_image: user.profile_image
      },
      token
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/me', auth.requireAuth, async (req, res) => {
  try {
    const user = await User.getUserById(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has active check-in
    const CheckIn = require('../models/checkInModel');
    const activeCheckIn = await CheckIn.getUserActiveCheckIn(req.user.user_id);
    
    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image: user.profile_image,
      bio: user.bio,
      is_verified: user.is_verified,
      created_at: user.created_at,
      active_check_in: activeCheckIn
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/me', [
  auth.requireAuth,
  body('username').optional().trim().isLength({ min: 3, max: 50 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  body('profile_image').optional().isURL(),
  body('bio').optional().trim()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    // Check if username is being changed and already exists
    if (req.body.username) {
      const existingUser = await User.getUserByUsername(req.body.username);
      if (existingUser && existingUser.user_id !== req.user.user_id) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }
    
    // Check if email is being changed and already exists
    if (req.body.email) {
      const existingUser = await User.getUserByEmail(req.body.email);
      if (existingUser && existingUser.user_id !== req.user.user_id) {
        return res.status(400).json({ message: 'Email already registered' });
      }
    }
    
    // Update user
    const user = await User.updateUser(req.user.user_id, req.body);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_image: user.profile_image,
      bio: user.bio
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/me/password', [
  auth.requireAuth,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { current_password, new_password } = req.body;
    
    // Verify current password
    const isValid = await User.verifyPassword(req.user.user_id, current_password);
    if (!isValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Change password
    await User.changePassword(req.user.user_id, new_password);
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's favorite cafes
router.get('/me/favorites', [
  auth.requireAuth,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const favorites = await User.getUserFavorites(req.user.user_id, page, limit);
    res.json(favorites);
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add cafe to favorites
router.post('/me/favorites/:cafeId', [
  auth.requireAuth,
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const Cafe = require('../models/cafeModel');
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    await User.addFavorite(req.user.user_id, req.params.cafeId);
    res.json({ message: 'Cafe added to favorites' });
  } catch (error) {
    console.error(`Error adding cafe ${req.params.cafeId} to favorites:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove cafe from favorites
router.delete('/me/favorites/:cafeId', [
  auth.requireAuth,
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    await User.removeFavorite(req.user.user_id, req.params.cafeId);
    res.json({ message: 'Cafe removed from favorites' });
  } catch (error) {
    console.error(`Error removing cafe ${req.params.cafeId} from favorites:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's check-in history
router.get('/me/check-ins', [
  auth.requireAuth,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const checkIns = await User.getUserCheckIns(req.user.user_id, page, limit);
    res.json(checkIns);
  } catch (error) {
    console.error('Error getting user check-ins:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/me/reviews', [
  auth.requireAuth,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const reviews = await User.getUserReviews(req.user.user_id, page, limit);
    res.json(reviews);
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check out from current cafe
router.post('/me/check-out', [
  auth.requireAuth
], async (req, res) => {
  try {
    const CheckIn = require('../models/checkInModel');
    const activeCheckIn = await CheckIn.getUserActiveCheckIn(req.user.user_id);
    
    if (!activeCheckIn) {
      return res.status(400).json({ message: 'No active check-in found' });
    }
    
    const checkIn = await CheckIn.checkOut(activeCheckIn.check_in_id);
    res.json(checkIn);
  } catch (error) {
    console.error('Error checking out:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
