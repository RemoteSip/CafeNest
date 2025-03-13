const express = require('express');
const router = express.Router();
const Cafe = require('../models/cafeModel');
const Review = require('../models/reviewModel');
const CheckIn = require('../models/checkInModel');
const auth = require('../middleware/auth');
const { body, query, param, validationResult } = require('express-validator');

// Get all cafes with pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { page = 1, limit = 10 } = req.query;
    const cafes = await Cafe.getAllCafes(page, limit);
    res.json(cafes);
  } catch (error) {
    console.error('Error getting cafes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search cafes with filters
router.get('/search', [
  query('query').optional().isString(),
  query('city').optional().isString(),
  query('amenities').optional().isArray(),
  query('categories').optional().isArray(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('maxNoise').optional().isInt({ min: 1, max: 5 }),
  query('minWifi').optional().isInt({ min: 0 }),
  query('openNow').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const searchParams = {
      query: req.query.query,
      city: req.query.city,
      amenities: req.query.amenities,
      categories: req.query.categories,
      minRating: req.query.minRating,
      maxNoise: req.query.maxNoise,
      minWifi: req.query.minWifi,
      openNow: req.query.openNow,
      page: req.query.page,
      limit: req.query.limit
    };
    const cafes = await Cafe.searchCafes(searchParams);
    res.json(cafes);
  } catch (error) {
    console.error('Error searching cafes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Find cafes nearby
router.get('/nearby', [
  query('latitude').isFloat({ min: -90, max: 90 }),
  query('longitude').isFloat({ min: -180, max: 180 }),
  query('radius').optional().isFloat({ min: 0.1, max: 50 }).toFloat(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { latitude, longitude, radius = 5, page = 1, limit = 10 } = req.query;
    const cafes = await Cafe.findNearby(latitude, longitude, radius, page, limit);
    res.json(cafes);
  } catch (error) {
    console.error('Error finding nearby cafes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific cafe
router.get('/:cafeId', [
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    // Add is_favorite field if user is authenticated
    if (req.user) {
      const User = require('../models/userModel');
      cafe.is_favorite = await User.isFavorite(req.user.user_id, req.params.cafeId);
    }
    
    res.json(cafe);
  } catch (error) {
    console.error(`Error getting cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new cafe (admin only)
router.post('/', [
  auth.requireAuth,
  auth.requireAdmin,
  body('name').notEmpty().trim(),
  body('address').notEmpty().trim(),
  body('city').notEmpty().trim(),
  body('country').notEmpty().trim(),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
  body('hours').isObject(),
  body('amenities').optional().isArray(),
  body('categories').optional().isArray(),
  body('images').optional().isArray()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafeId = await Cafe.createCafe(req.body);
    const cafe = await Cafe.getCafeById(cafeId);
    res.status(201).json(cafe);
  } catch (error) {
    console.error('Error creating cafe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a cafe (admin only)
router.put('/:cafeId', [
  auth.requireAuth,
  auth.requireAdmin,
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const updatedCafe = await Cafe.updateCafe(req.params.cafeId, req.body);
    res.json(updatedCafe);
  } catch (error) {
    console.error(`Error updating cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a cafe (admin only)
router.delete('/:cafeId', [
  auth.requireAuth,
  auth.requireAdmin,
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    await Cafe.deleteCafe(req.params.cafeId);
    res.json({ message: 'Cafe deleted successfully' });
  } catch (error) {
    console.error(`Error deleting cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reviews for a cafe
router.get('/:cafeId/reviews', [
  param('cafeId').isInt().toInt(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const { page = 1, limit = 10 } = req.query;
    const reviews = await Review.getCafeReviews(req.params.cafeId, page, limit);
    res.json(reviews);
  } catch (error) {
    console.error(`Error getting reviews for cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a review for a cafe
router.post('/:cafeId/reviews', [
  auth.requireAuth,
  param('cafeId').isInt().toInt(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional().isString(),
  body('wifi_rating').optional().isInt({ min: 1, max: 5 }),
  body('power_rating').optional().isInt({ min: 1, max: 5 }),
  body('comfort_rating').optional().isInt({ min: 1, max: 5 }),
  body('noise_rating').optional().isInt({ min: 1, max: 5 }),
  body('coffee_rating').optional().isInt({ min: 1, max: 5 }),
  body('food_rating').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const reviewData = {
      cafe_id: req.params.cafeId,
      user_id: req.user.user_id,
      ...req.body
    };
    
    const review = await Review.createReview(reviewData);
    res.status(201).json(review);
  } catch (error) {
    if (error.message === 'User has already reviewed this cafe') {
      return res.status(400).json({ message: error.message });
    }
    console.error(`Error adding review for cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active check-ins for a cafe
router.get('/:cafeId/check-ins', [
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const checkIns = await CheckIn.getActiveCafeCheckIns(req.params.cafeId);
    res.json(checkIns);
  } catch (error) {
    console.error(`Error getting check-ins for cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check in to a cafe
router.post('/:cafeId/check-in', [
  auth.requireAuth,
  param('cafeId').isInt().toInt(),
  body('occupancy_report').optional().isInt({ min: 0, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const checkIn = await CheckIn.createCheckIn(
      req.params.cafeId,
      req.user.user_id,
      req.body.occupancy_report
    );
    
    res.status(201).json(checkIn);
  } catch (error) {
    console.error(`Error checking in to cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get occupancy data for a cafe
router.get('/:cafeId/occupancy', [
  param('cafeId').isInt().toInt()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const cafe = await Cafe.getCafeById(req.params.cafeId);
    
    if (!cafe) {
      return res.status(404).json({ message: 'Cafe not found' });
    }
    
    const occupancyData = await CheckIn.getCafeOccupancyData(req.params.cafeId);
    res.json(occupancyData);
  } catch (error) {
    console.error(`Error getting occupancy data for cafe ${req.params.cafeId}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;