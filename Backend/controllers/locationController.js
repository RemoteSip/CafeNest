// Example implementation of location controller using Node.js with PostgreSQL

const pool = require('../config/database');
const { cloudinaryUpload } = require('../utils/fileUpload');
const ApiError = require('../utils/apiError');

// Helper function to handle photo uploads
const handlePhotoUploads = async (files, locationId, userId) => {
  const photoUrls = [];
  
  if (!files || files.length === 0) {
    return photoUrls;
  }
  
  for (const file of files) {
    try {
      // Upload to cloud storage (e.g., Cloudinary, AWS S3)
      const uploadResult = await cloudinaryUpload(file.path, 'locations');
      
      // Add to database
      const query = `
        INSERT INTO location_photos 
        (location_id, photo_url, uploaded_by, is_primary) 
        VALUES ($1, $2, $3, $4)
        RETURNING photo_id, photo_url
      `;
      
      // First uploaded photo is primary if no other photos exist
      const isPrimary = photoUrls.length === 0;
      const values = [locationId, uploadResult.secure_url, userId, isPrimary];
      
      const result = await pool.query(query, values);
      photoUrls.push(result.rows[0]);
    } catch (error) {
      console.error('Error uploading photo:', error);
      // Continue with other photos if one fails
    }
  }
  
  return photoUrls;
};

// Controller methods
const locationController = {
  // Get all approved locations with filtering
  getAllLocations: async (req, res, next) => {
    try {
      const { 
        city, wifi, power, noise, page = 1, limit = 20,
        lat, lng, distance, sort = 'rating'
      } = req.query;
      
      const offset = (page - 1) * limit;
      let query = `
        SELECT l.*, 
          COALESCE(AVG(r.overall_rating), 0) as average_rating,
          COUNT(r.review_id) as review_count,
          a.has_wifi, a.wifi_speed, a.power_outlets, a.noise_level, a.price_range
        FROM locations l
        LEFT JOIN location_reviews r ON l.location_id = r.location_id
        LEFT JOIN location_amenities a ON l.location_id = a.location_id
        WHERE l.status = 'approved'
      `;
      
      const queryParams = [];
      let paramIndex = 1;
      
      // Add filters
      if (city) {
        query += ` AND LOWER(l.city) = LOWER($${paramIndex})`;
        queryParams.push(city);
        paramIndex++;
      }
      
      if (wifi === 'true') {
        query += ` AND a.has_wifi = true`;
      }
      
      if (power) {
        query += ` AND a.power_outlets = $${paramIndex}`;
        queryParams.push(power);
        paramIndex++;
      }
      
      if (noise) {
        query += ` AND a.noise_level = $${paramIndex}`;
        queryParams.push(noise);
        paramIndex++;
      }
      
      // Location-based search with distance
      if (lat && lng && distance) {
        query += `
          AND (
            6371 * acos(
              cos(radians($${paramIndex})) * 
              cos(radians(l.latitude)) * 
              cos(radians(l.longitude) - radians($${paramIndex + 1})) + 
              sin(radians($${paramIndex})) * 
              sin(radians(l.latitude))
            )
          ) <= $${paramIndex + 2}
        `;
        queryParams.push(lat, lng, distance);
        paramIndex += 3;
      }
      
      // Group by location_id
      query += ` GROUP BY l.location_id, a.has_wifi, a.wifi_speed, a.power_outlets, a.noise_level, a.price_range`;
      
      // Add sorting
      if (sort === 'rating') {
        query += ` ORDER BY average_rating DESC`;
      } else if (sort === 'reviews') {
        query += ` ORDER BY review_count DESC`;
      } else if (sort === 'newest') {
        query += ` ORDER BY l.created_at DESC`;
      }
      
      // Add pagination
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      queryParams.push(limit, offset);
      
      const result = await pool.query(query, queryParams);
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(*) 
        FROM locations l
        LEFT JOIN location_amenities a ON l.location_id = a.location_id
        WHERE l.status = 'approved'
      `;
      
      // Add the same filters to count query
      if (city) {
        countQuery += ` AND LOWER(l.city) = LOWER($1)`;
      }
      
      if (wifi === 'true') {
        countQuery += ` AND a.has_wifi = true`;
      }
      
      if (power) {
        const powerIndex = queryParams.indexOf(power) + 1;
        countQuery += ` AND a.power_outlets = $${powerIndex}`;
      }
      
      if (noise) {
        const noiseIndex = queryParams.indexOf(noise) + 1;
        countQuery += ` AND a.noise_level = $${noiseIndex}`;
      }
      
      // Add distance filter to count query if needed
      if (lat && lng && distance) {
        const latIndex = queryParams.indexOf(lat) + 1;
        countQuery += `
          AND (
            6371 * acos(
              cos(radians($${latIndex})) * 
              cos(radians(l.latitude)) * 
              cos(radians(l.longitude) - radians($${latIndex + 1})) + 
              sin(radians($${latIndex})) * 
              sin(radians(l.latitude))
            )
          ) <= $${latIndex + 2}
        `;
      }
      
      const countResult = await pool.query(countQuery, queryParams.slice(0, paramIndex - 2));
      const totalResults = parseInt(countResult.rows[0].count);
      
      // Fetch primary photos for each location
      for (const location of result.rows) {
        const photoQuery = `
          SELECT photo_url 
          FROM location_photos 
          WHERE location_id = $1 AND is_primary = true
          LIMIT 1
        `;
        const photoResult = await pool.query(photoQuery, [location.location_id]);
        
        if (photoResult.rows.length > 0) {
          location.primary_photo = photoResult.rows[0].photo_url;
        } else {
          location.primary_photo = null;
        }
      }
      
      res.json({
        success: true,
        count: result.rows.length,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: parseInt(page),
        locations: result.rows
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get a single location by ID
  getLocationById: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Get main location data
      const locationQuery = `
        SELECT l.*, 
          COALESCE(AVG(r.overall_rating), 0) as average_rating,
          COUNT(r.review_id) as review_count
        FROM locations l
        LEFT JOIN location_reviews r ON l.location_id = r.location_id
        WHERE l.location_id = $1 AND l.status = 'approved'
        GROUP BY l.location_id
      `;
      
      const locationResult = await pool.query(locationQuery, [id]);
      
      if (locationResult.rows.length === 0) {
        return next(new ApiError('Location not found', 404));
      }
      
      const location = locationResult.rows[0];
      
      // Get amenities
      const amenitiesQuery = `
        SELECT * FROM location_amenities WHERE location_id = $1
      `;
      const amenitiesResult = await pool.query(amenitiesQuery, [id]);
      
      if (amenitiesResult.rows.length > 0) {
        location.amenities = amenitiesResult.rows[0];
      }
      
      // Get dietary options
      const dietaryQuery = `
        INSERT INTO location_dietary_options 
        (location_id, has_vegan, has_vegetarian, has_gluten_free, has_dairy_free, has_other_options)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const dietaryValues = [
        locationId,
        has_vegan || false,
        has_vegetarian || false,
        has_gluten_free || false,
        has_dairy_free || false,
        other_dietary || null
      ];
      
      await client.query(dietaryQuery, dietaryValues);
      
      // 5. Upload and save photos
      const photos = await handlePhotoUploads(req.files, locationId, userId);
      
      // 6. Add to location history
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        locationId,
        userId,
        'create',
        'Initial submission'
      ]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Location submitted successfully and pending approval',
        locationId,
        photos
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  // Update an existing location
  updateLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const {
        name, address, city, state, country, zip_code,
        latitude, longitude, website, phone, email,
        
        // Hours
        hours,
        
        // Amenities
        has_wifi, wifi_speed, wifi_password, wifi_restrictions,
        power_outlets, noise_level, seating_comfort,
        time_restrictions, purchase_requirements,
        price_range, restrooms_available, parking_options, special_features,
        
        // Dietary options
        has_vegan, has_vegetarian, has_gluten_free, has_dairy_free, other_dietary
      } = req.body;
      
      const userId = req.user.id;
      
      // Check if location exists
      const locationCheck = await client.query(
        'SELECT * FROM locations WHERE location_id = $1',
        [id]
      );
      
      if (locationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new ApiError('Location not found', 404));
      }
      
      // Check if user has permission to update
      const location = locationCheck.rows[0];
      if (location.submitted_by !== userId && req.user.role !== 'admin') {
        await client.query('ROLLBACK');
        return next(new ApiError('Not authorized to update this location', 403));
      }
      
      // Update location main info
      const locationQuery = `
        UPDATE locations
        SET name = $1, address = $2, city = $3, state = $4, country = $5,
            zip_code = $6, latitude = $7, longitude = $8, website = $9,
            phone = $10, email = $11, updated_at = CURRENT_TIMESTAMP
        WHERE location_id = $12
        RETURNING *
      `;
      
      const locationValues = [
        name || location.name,
        address || location.address,
        city || location.city,
        state || location.state,
        country || location.country,
        zip_code || location.zip_code,
        latitude || location.latitude,
        longitude || location.longitude,
        website || location.website,
        phone || location.phone,
        email || location.email,
        id
      ];
      
      await client.query(locationQuery, locationValues);
      
      // Update hours if provided
      if (hours && Array.isArray(hours)) {
        // First delete existing hours
        await client.query('DELETE FROM location_hours WHERE location_id = $1', [id]);
        
        // Then insert new hours
        const hoursQuery = `
          INSERT INTO location_hours 
          (location_id, day_of_week, open_time, close_time, is_closed)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        for (const hour of hours) {
          await client.query(hoursQuery, [
            id,
            hour.day_of_week,
            hour.open_time,
            hour.close_time,
            hour.is_closed || false
          ]);
        }
      }
      
      // Update amenities if provided
      const amenitiesCheck = await client.query(
        'SELECT * FROM location_amenities WHERE location_id = $1',
        [id]
      );
      
      if (amenitiesCheck.rows.length > 0) {
        // Update existing amenities
        const amenitiesQuery = `
          UPDATE location_amenities
          SET has_wifi = $1, wifi_speed = $2, wifi_password = $3, wifi_restrictions = $4,
              power_outlets = $5, noise_level = $6, seating_comfort = $7,
              time_restrictions = $8, purchase_requirements = $9, price_range = $10,
              restrooms_available = $11, parking_options = $12, special_features = $13,
              last_updated = CURRENT_TIMESTAMP, updated_by = $14
          WHERE location_id = $15
        `;
        
        const amenitiesValues = [
          has_wifi !== undefined ? has_wifi : amenitiesCheck.rows[0].has_wifi,
          wifi_speed || amenitiesCheck.rows[0].wifi_speed,
          wifi_password || amenitiesCheck.rows[0].wifi_password,
          wifi_restrictions || amenitiesCheck.rows[0].wifi_restrictions,
          power_outlets || amenitiesCheck.rows[0].power_outlets,
          noise_level || amenitiesCheck.rows[0].noise_level,
          seating_comfort || amenitiesCheck.rows[0].seating_comfort,
          time_restrictions || amenitiesCheck.rows[0].time_restrictions,
          purchase_requirements || amenitiesCheck.rows[0].purchase_requirements,
          price_range || amenitiesCheck.rows[0].price_range,
          restrooms_available !== undefined ? restrooms_available : amenitiesCheck.rows[0].restrooms_available,
          parking_options || amenitiesCheck.rows[0].parking_options,
          special_features || amenitiesCheck.rows[0].special_features,
          userId,
          id
        ];
        
        await client.query(amenitiesQuery, amenitiesValues);
      } else {
        // Insert new amenities
        const amenitiesQuery = `
          INSERT INTO location_amenities 
          (location_id, has_wifi, wifi_speed, wifi_password, wifi_restrictions,
           power_outlets, noise_level, seating_comfort, time_restrictions,
           purchase_requirements, price_range, restrooms_available,
           parking_options, special_features, updated_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        
        const amenitiesValues = [
          id,
          has_wifi || false,
          wifi_speed || null,
          wifi_password || null,
          wifi_restrictions || null,
          power_outlets || 'None',
          noise_level || 'Moderate',
          seating_comfort || 'Fair',
          time_restrictions || 'None',
          purchase_requirements || 'None',
          price_range || '$',
          restrooms_available !== undefined ? restrooms_available : true,
          parking_options || 'None',
          special_features || null,
          userId
        ];
        
        await client.query(amenitiesQuery, amenitiesValues);
      }
      
      // Update dietary options if provided
      const dietaryCheck = await client.query(
        'SELECT * FROM location_dietary_options WHERE location_id = $1',
        [id]
      );
      
      if (dietaryCheck.rows.length > 0) {
        // Update existing dietary options
        const dietaryQuery = `
          UPDATE location_dietary_options
          SET has_vegan = $1, has_vegetarian = $2, has_gluten_free = $3,
              has_dairy_free = $4, has_other_options = $5
          WHERE location_id = $6
        `;
        
        const dietaryValues = [
          has_vegan !== undefined ? has_vegan : dietaryCheck.rows[0].has_vegan,
          has_vegetarian !== undefined ? has_vegetarian : dietaryCheck.rows[0].has_vegetarian,
          has_gluten_free !== undefined ? has_gluten_free : dietaryCheck.rows[0].has_gluten_free,
          has_dairy_free !== undefined ? has_dairy_free : dietaryCheck.rows[0].has_dairy_free,
          other_dietary || dietaryCheck.rows[0].has_other_options,
          id
        ];
        
        await client.query(dietaryQuery, dietaryValues);
      } else {
        // Insert new dietary options
        const dietaryQuery = `
          INSERT INTO location_dietary_options 
          (location_id, has_vegan, has_vegetarian, has_gluten_free, has_dairy_free, has_other_options)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        const dietaryValues = [
          id,
          has_vegan || false,
          has_vegetarian || false,
          has_gluten_free || false,
          has_dairy_free || false,
          other_dietary || null
        ];
        
        await client.query(dietaryQuery, dietaryValues);
      }
      
      // Handle photo uploads if any
      if (req.files && req.files.length > 0) {
        await handlePhotoUploads(req.files, id, userId);
      }
      
      // Add to location history
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        id,
        userId,
        'update',
        req.body.update_reason || 'Information updated'
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Location updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },

  // Approve a location (admin only)
  approveLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if location exists and is pending
      const locationCheck = await client.query(
        'SELECT * FROM locations WHERE location_id = $1 AND status = $2',
        [id, 'pending']
      );
      
      if (locationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new ApiError('Pending location not found', 404));
      }
      
      // Update status to approved
      await client.query(
        'UPDATE locations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE location_id = $2',
        ['approved', id]
      );
      
      // Add to location history
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        id,
        userId,
        'approve',
        req.body.admin_notes || 'Location approved by admin'
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Location approved successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },
  
  // Reject a location (admin only)
  rejectLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const userId = req.user.id;
      
      if (!rejection_reason) {
        await client.query('ROLLBACK');
        return next(new ApiError('Rejection reason is required', 400));
      }
      
      // Check if location exists and is pending
      const locationCheck = await client.query(
        'SELECT * FROM locations WHERE location_id = $1 AND status = $2',
        [id, 'pending']
      );
      
      if (locationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new ApiError('Pending location not found', 404));
      }
      
      // Update status to rejected and add rejection reason
      await client.query(
        'UPDATE locations SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP WHERE location_id = $3',
        ['rejected', rejection_reason, id]
      );
      
      // Add to location history
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        id,
        userId,
        'reject',
        rejection_reason
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Location rejected successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },
  
  // Get all pending locations for admin
  getPendingLocations: async (req, res, next) => {
    try {
      const query = `
        SELECT l.*, 
          u.first_name || ' ' || u.last_name as submitted_by_name,
          (
            SELECT photo_url 
            FROM location_photos 
            WHERE location_id = l.location_id AND is_primary = true
            LIMIT 1
          ) as primary_photo
        FROM locations l
        JOIN users u ON l.submitted_by = u.user_id
        WHERE l.status = 'pending'
        ORDER BY l.created_at DESC
      `;
      
      const result = await pool.query(query);
      
      res.json({
        success: true,
        count: result.rows.length,
        locations: result.rows
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get all submissions by current user
  getUserSubmissions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT l.*, 
          (
            SELECT photo_url 
            FROM location_photos 
            WHERE location_id = l.location_id AND is_primary = true
            LIMIT 1
          ) as primary_photo
        FROM locations l
        WHERE l.submitted_by = $1
        ORDER BY l.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      res.json({
        success: true,
        count: result.rows.length,
        locations: result.rows
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Get all reviews for a location
  getLocationReviews: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;
      
      const query = `
        SELECT r.*, 
          u.first_name, u.last_name, u.profile_photo_url
        FROM location_reviews r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.location_id = $1 AND r.status = 'active'
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await pool.query(query, [id, limit, offset]);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) 
        FROM location_reviews 
        WHERE location_id = $1 AND status = 'active'
      `;
      
      const countResult = await pool.query(countQuery, [id]);
      const totalResults = parseInt(countResult.rows[0].count);
      
      res.json({
        success: true,
        count: result.rows.length,
        total: totalResults,
        totalPages: Math.ceil(totalResults / limit),
        currentPage: parseInt(page),
        reviews: result.rows
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Add a review to a location
  addReview: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        overall_rating,
        wifi_rating,
        power_rating,
        comfort_rating,
        noise_rating,
        review_text
      } = req.body;
      
      const userId = req.user.id;
      
      // Check if user has already reviewed this location
      const checkQuery = `
        SELECT * FROM location_reviews 
        WHERE location_id = $1 AND user_id = $2
      `;
      
      const checkResult = await pool.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length > 0) {
        return next(new ApiError('You have already reviewed this location', 400));
      }
      
      // Insert review
      const query = `
        INSERT INTO location_reviews
        (location_id, user_id, overall_rating, wifi_rating, power_rating, 
         comfort_rating, noise_rating, review_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        id,
        userId,
        overall_rating,
        wifi_rating,
        power_rating,
        comfort_rating,
        noise_rating,
        review_text
      ];
      
      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        review: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Add photos to a location
  addPhotos: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if location exists
      const locationCheck = await pool.query(
        'SELECT * FROM locations WHERE location_id = $1',
        [id]
      );
      
      if (locationCheck.rows.length === 0) {
        return next(new ApiError('Location not found', 404));
      }
      
      // Upload and save photos
      const photos = await handlePhotoUploads(req.files, id, userId);
      
      res.status(201).json({
        success: true,
        message: 'Photos added successfully',
        photos
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Submit verification for a location
  verifyLocation: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        verified_wifi,
        verified_power,
        verified_noise,
        verified_seating,
        verified_hours,
        notes
      } = req.body;
      
      const userId = req.user.id;
      
      // Check if location exists
      const locationCheck = await pool.query(
        'SELECT * FROM locations WHERE location_id = $1',
        [id]
      );
      
      if (locationCheck.rows.length === 0) {
        return next(new ApiError('Location not found', 404));
      }
      
      // Add verification
      const query = `
        INSERT INTO location_verifications
        (location_id, user_id, verified_wifi, verified_power, 
         verified_noise, verified_seating, verified_hours, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        id,
        userId,
        verified_wifi || false,
        verified_power || false,
        verified_noise || false,
        verified_seating || false,
        verified_hours || false,
        notes || null
      ];
      
      const result = await pool.query(query, values);
      
      res.status(201).json({
        success: true,
        message: 'Verification submitted successfully',
        verification: result.rows[0]
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Claim ownership of a location
  claimLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if location exists
      const locationCheck = await client.query(
        'SELECT * FROM locations WHERE location_id = $1',
        [id]
      );
      
      if (locationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new ApiError('Location not found', 404));
      }
      
      // Check if location is already claimed
      if (locationCheck.rows[0].is_claimed) {
        await client.query('ROLLBACK');
        return next(new ApiError('Location is already claimed', 400));
      }
      
      // Update location as claimed
      await client.query(
        'UPDATE locations SET is_claimed = true, claimed_by = $1, claimed_at = CURRENT_TIMESTAMP WHERE location_id = $2',
        [userId, id]
      );
      
      // Add to location history
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        id,
        userId,
        'claim',
        'Location claimed by business owner'
      ]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Location claimed successfully. Our team will verify your ownership soon.'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  },
  
  // Delete a location (admin only)
  deleteLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      
      // Check if location exists
      const locationCheck = await client.query(
        'SELECT * FROM locations WHERE location_id = $1',
        [id]
      );
      
      if (locationCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return next(new ApiError('Location not found', 404));
      }
      
      // Add to history before deletion
      const historyQuery = `
        INSERT INTO location_history 
        (location_id, modified_by, modification_type, modified_at, reason)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      `;
      
      await client.query(historyQuery, [
        id,
        req.user.id,
        'delete',
        req.body.delete_reason || 'Location deleted by admin'
      ]);
      
      // Delete location (will cascade to all related tables)
      await client.query('DELETE FROM locations WHERE location_id = $1', [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Location deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      next(error);
    } finally {
      client.release();
    }
  }
};

module.exports = locationController; `
        SELECT * FROM location_dietary_options WHERE location_id = $1
      `;
      const dietaryResult = await pool.query(dietaryQuery, [id]);
      
      if (dietaryResult.rows.length > 0) {
        location.dietary = dietaryResult.rows[0];
      }
      
      // Get hours
      const hoursQuery = `
        SELECT day_of_week, open_time, close_time, is_closed 
        FROM location_hours 
        WHERE location_id = $1
        ORDER BY day_of_week
      `;
      const hoursResult = await pool.query(hoursQuery, [id]);
      location.hours = hoursResult.rows;
      
      // Get photos
      const photosQuery = `
        SELECT photo_id, photo_url, caption, is_primary
        FROM location_photos
        WHERE location_id = $1 AND status = 'approved'
      `;
      const photosResult = await pool.query(photosQuery, [id]);
      location.photos = photosResult.rows;
      
      // Get top reviews
      const reviewsQuery = `
        SELECT r.review_id, r.overall_rating, r.wifi_rating, r.power_rating, 
               r.comfort_rating, r.noise_rating, r.review_text, r.created_at,
               r.likes_count, r.dislikes_count,
               u.user_id, u.first_name, u.last_name, u.profile_photo_url
        FROM location_reviews r
        JOIN users u ON r.user_id = u.user_id
        WHERE r.location_id = $1 AND r.status = 'active'
        ORDER BY r.likes_count DESC, r.created_at DESC
        LIMIT 3
      `;
      const reviewsResult = await pool.query(reviewsQuery, [id]);
      location.top_reviews = reviewsResult.rows;
      
      // Update view count
      await pool.query(`
        UPDATE locations 
        SET view_count = view_count + 1 
        WHERE location_id = $1
      `, [id]);
      
      res.json({
        success: true,
        location
      });
    } catch (error) {
      next(error);
    }
  },
  
  // Add a new location
  addLocation: async (req, res, next) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        name, address, city, state, country, zip_code,
        latitude, longitude, website, phone, email,
        
        // Hours
        hours,
        
        // Amenities
        has_wifi, wifi_speed, wifi_password, wifi_restrictions,
        power_outlets, noise_level, seating_comfort,
        time_restrictions, purchase_requirements,
        price_range, restrooms_available, parking_options, special_features,
        
        // Dietary options
        has_vegan, has_vegetarian, has_gluten_free, has_dairy_free, other_dietary
      } = req.body;
      
      const userId = req.user.id;
      
      // 1. Insert location
      const locationQuery = `
        INSERT INTO locations 
        (name, address, city, state, country, zip_code, latitude, longitude, 
         website, phone, email, submitted_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING location_id
      `;
      
      const locationValues = [
        name, address, city, state, country, zip_code,
        latitude, longitude, website, phone, email,
        userId, 'pending' // Default status is pending until approved
      ];
      
      const locationResult = await client.query(locationQuery, locationValues);
      const locationId = locationResult.rows[0].location_id;
      
      // 2. Insert operating hours
      if (hours && Array.isArray(hours)) {
        const hoursQuery = `
          INSERT INTO location_hours 
          (location_id, day_of_week, open_time, close_time, is_closed)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        for (const hour of hours) {
          await client.query(hoursQuery, [
            locationId,
            hour.day_of_week,
            hour.open_time,
            hour.close_time,
            hour.is_closed || false
          ]);
        }
      }
      
      // 3. Insert amenities
      const amenitiesQuery = `
        INSERT INTO location_amenities 
        (location_id, has_wifi, wifi_speed, wifi_password, wifi_restrictions,
         power_outlets, noise_level, seating_comfort, time_restrictions,
         purchase_requirements, price_range, restrooms_available,
         parking_options, special_features, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;
      
      const amenitiesValues = [
        locationId,
        has_wifi || false,
        wifi_speed || null,
        wifi_password || null,
        wifi_restrictions || null,
        power_outlets || 'None',
        noise_level || 'Moderate',
        seating_comfort || 'Fair',
        time_restrictions || 'None',
        purchase_requirements || 'None',
        price_range || '$$',
        restrooms_available !== undefined ? restrooms_available : true,
        parking_options || 'None',
        special_features || null,
        userId
      ];
      
      await client.query(amenitiesQuery, amenitiesValues);
      
      // 4. Insert dietary options
      const dietaryQuery =