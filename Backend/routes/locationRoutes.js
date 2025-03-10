// Example implementation of location management API routes using Express.js

const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

/**
 * @route   GET /api/locations
 * @desc    Get all approved locations with filtering options
 * @access  Public
 */
router.get('/', locationController.getAllLocations);

/**
 * @route   GET /api/locations/:id
 * @desc    Get a single location by ID
 * @access  Public
 */
router.get('/:id', locationController.getLocationById);

/**
 * @route   POST /api/locations
 * @desc    Add a new location (requires authentication)
 * @access  Private
 */
router.post('/', 
  authMiddleware.requireAuth, 
  uploadMiddleware.array('photos', 10), 
  locationController.addLocation
);

/**
 * @route   PUT /api/locations/:id
 * @desc    Update a location (requires authentication & ownership or admin)
 * @access  Private
 */
router.put('/:id', 
  authMiddleware.requireAuth,
  authMiddleware.checkOwnershipOrAdmin('location'),
  uploadMiddleware.array('photos', 10),
  locationController.updateLocation
);

/**
 * @route   DELETE /api/locations/:id
 * @desc    Delete a location (requires admin)
 * @access  Admin
 */
router.delete('/:id', 
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  locationController.deleteLocation
);

/**
 * @route   POST /api/locations/:id/claim
 * @desc    Claim ownership of a location
 * @access  Private
 */
router.post('/:id/claim', 
  authMiddleware.requireAuth,
  locationController.claimLocation
);

/**
 * @route   GET /api/locations/:id/reviews
 * @desc    Get all reviews for a location
 * @access  Public
 */
router.get('/:id/reviews', locationController.getLocationReviews);

/**
 * @route   POST /api/locations/:id/reviews
 * @desc    Add a review to a location
 * @access  Private
 */
router.post('/:id/reviews', 
  authMiddleware.requireAuth,
  locationController.addReview
);

/**
 * @route   POST /api/locations/:id/photos
 * @desc    Add photos to a location
 * @access  Private
 */
router.post('/:id/photos', 
  authMiddleware.requireAuth,
  uploadMiddleware.array('photos', 10),
  locationController.addPhotos
);

/**
 * @route   POST /api/locations/:id/verify
 * @desc    Submit verification for a location
 * @access  Private
 */
router.post('/:id/verify', 
  authMiddleware.requireAuth,
  locationController.verifyLocation
);

/**
 * @route   GET /api/locations/pending
 * @desc    Get all pending location submissions (admin only)
 * @access  Admin
 */
router.get('/admin/pending', 
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  locationController.getPendingLocations
);

/**
 * @route   PUT /api/locations/:id/approve
 * @desc    Approve a pending location (admin only)
 * @access  Admin
 */
router.put('/admin/:id/approve', 
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  locationController.approveLocation
);

/**
 * @route   PUT /api/locations/:id/reject
 * @desc    Reject a pending location (admin only)
 * @access  Admin
 */
router.put('/admin/:id/reject', 
  authMiddleware.requireAuth,
  authMiddleware.requireAdmin,
  locationController.rejectLocation
);

/**
 * @route   GET /api/locations/user
 * @desc    Get all locations submitted by the current user
 * @access  Private
 */
router.get('/user/submissions', 
  authMiddleware.requireAuth,
  locationController.getUserSubmissions
);

module.exports = router;