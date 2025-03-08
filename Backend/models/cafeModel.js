const db = require('../database/config');

// Cafe model with database operations
const Cafe = {
  // Get all cafes with pagination
  async getAllCafes(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
      const result = await db.query(
        `SELECT c.*, 
                COALESCE(rs.overall_rating, 0) AS rating, 
                COALESCE(rs.review_count, 0) AS review_count,
                COALESCE(co.occupancy_percentage, 0) AS occupancy_percentage,
                COALESCE(co.active_users, 0) AS active_users,
                (
                  SELECT json_agg(json_build_object(
                    'image_id', ci.image_id,
                    'image_url', ci.image_url,
                    'is_primary', ci.is_primary
                  ))
                  FROM cafe_images ci
                  WHERE ci.cafe_id = c.cafe_id
                  LIMIT 3
                ) AS images,
                (
                  SELECT json_agg(a.name)
                  FROM cafe_amenities ca
                  JOIN amenities a ON ca.amenity_id = a.amenity_id
                  WHERE ca.cafe_id = c.cafe_id
                ) AS amenities,
                (
                  SELECT json_agg(cat.name)
                  FROM cafe_categories cc
                  JOIN categories cat ON cc.category_id = cat.category_id
                  WHERE cc.cafe_id = c.cafe_id
                ) AS categories
         FROM cafes c
         LEFT JOIN cafe_rating_summary rs ON c.cafe_id = rs.cafe_id
         LEFT JOIN current_occupancy co ON c.cafe_id = co.cafe_id
         ORDER BY rating DESC, name ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting cafes:', error);
      throw error;
    }
  },

  // Get cafe by ID
  async getCafeById(cafeId) {
    try {
      const result = await db.query(
        `SELECT c.*, 
                COALESCE(rs.overall_rating, 0) AS rating, 
                COALESCE(rs.review_count, 0) AS review_count,
                COALESCE(rs.avg_wifi_rating, 0) AS wifi_rating,
                COALESCE(rs.avg_power_rating, 0) AS power_rating,
                COALESCE(rs.avg_comfort_rating, 0) AS comfort_rating,
                COALESCE(rs.avg_noise_rating, 0) AS noise_rating,
                COALESCE(rs.avg_coffee_rating, 0) AS coffee_rating,
                COALESCE(rs.avg_food_rating, 0) AS food_rating,
                COALESCE(co.occupancy_percentage, 0) AS occupancy_percentage,
                COALESCE(co.active_users, 0) AS active_users,
                (
                  SELECT json_agg(json_build_object(
                    'image_id', ci.image_id,
                    'image_url', ci.image_url,
                    'caption', ci.caption,
                    'is_primary', ci.is_primary
                  ))
                  FROM cafe_images ci
                  WHERE ci.cafe_id = c.cafe_id
                ) AS images,
                (
                  SELECT json_agg(json_build_object(
                    'amenity_id', a.amenity_id,
                    'name', a.name,
                    'icon', a.icon,
                    'category', a.category
                  ))
                  FROM cafe_amenities ca
                  JOIN amenities a ON ca.amenity_id = a.amenity_id
                  WHERE ca.cafe_id = c.cafe_id
                ) AS amenities,
                (
                  SELECT json_agg(json_build_object(
                    'category_id', cat.category_id,
                    'name', cat.name,
                    'description', cat.description
                  ))
                  FROM cafe_categories cc
                  JOIN categories cat ON cc.category_id = cat.category_id
                  WHERE cc.cafe_id = c.cafe_id
                ) AS categories
         FROM cafes c
         LEFT JOIN cafe_rating_summary rs ON c.cafe_id = rs.cafe_id
         LEFT JOIN current_occupancy co ON c.cafe_id = co.cafe_id
         WHERE c.cafe_id = $1`,
        [cafeId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting cafe with ID ${cafeId}:`, error);
      throw error;
    }
  },

  // Find cafes near a location
  async findNearby(latitude, longitude, radius = 5, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    // Earth's radius in kilometers
    const earthRadius = 6371;
    
    try {
      const result = await db.query(
        `SELECT c.*, 
                COALESCE(rs.overall_rating, 0) AS rating, 
                COALESCE(rs.review_count, 0) AS review_count,
                COALESCE(co.occupancy_percentage, 0) AS occupancy_percentage,
                (
                  SELECT json_agg(json_build_object(
                    'image_id', ci.image_id,
                    'image_url', ci.image_url,
                    'is_primary', ci.is_primary
                  ))
                  FROM cafe_images ci
                  WHERE ci.cafe_id = c.cafe_id
                  LIMIT 3
                ) AS images,
                (
                  SELECT json_agg(a.name)
                  FROM cafe_amenities ca
                  JOIN amenities a ON ca.amenity_id = a.amenity_id
                  WHERE ca.cafe_id = c.cafe_id
                ) AS amenities,
                ${earthRadius} * acos(
                  cos(radians($1)) * 
                  cos(radians(latitude)) * 
                  cos(radians(longitude) - radians($2)) + 
                  sin(radians($1)) * 
                  sin(radians(latitude))
                ) AS distance
         FROM cafes c
         LEFT JOIN cafe_rating_summary rs ON c.cafe_id = rs.cafe_id
         LEFT JOIN current_occupancy co ON c.cafe_id = co.cafe_id
         WHERE ${earthRadius} * acos(
                  cos(radians($1)) * 
                  cos(radians(latitude)) * 
                  cos(radians(longitude) - radians($2)) + 
                  sin(radians($1)) * 
                  sin(radians(latitude))
                ) <= $3
         ORDER BY distance ASC, rating DESC
         LIMIT $4 OFFSET $5`,
        [latitude, longitude, radius, limit, offset]
      );
      return result.rows;
    } catch (error) {
      console.error('Error finding nearby cafes:', error);
      throw error;
    }
  },

  // Search cafes with various filters
  async searchCafes(params) {
    const {
      query = '',
      city = '',
      amenities = [],
      categories = [],
      minRating = 0,
      maxNoise = 5,
      minWifi = 0,
      openNow = false,
      page = 1,
      limit = 10
    } = params;
    
    const offset = (page - 1) * limit;
    
    // Build the query with dynamic filters
    let sqlQuery = `
      SELECT c.*, 
             COALESCE(rs.overall_rating, 0) AS rating, 
             COALESCE(rs.review_count, 0) AS review_count,
             COALESCE(co.occupancy_percentage, 0) AS occupancy_percentage,
             (
               SELECT json_agg(json_build_object(
                 'image_id', ci.image_id,
                 'image_url', ci.image_url,
                 'is_primary', ci.is_primary
               ))
               FROM cafe_images ci
               WHERE ci.cafe_id = c.cafe_id
               LIMIT 3
             ) AS images,
             (
               SELECT json_agg(a.name)
               FROM cafe_amenities ca
               JOIN amenities a ON ca.amenity_id = a.amenity_id
               WHERE ca.cafe_id = c.cafe_id
             ) AS amenities
      FROM cafes c
      LEFT JOIN cafe_rating_summary rs ON c.cafe_id = rs.cafe_id
      LEFT JOIN current_occupancy co ON c.cafe_id = co.cafe_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;
    
    // Add text search condition
    if (query) {
      sqlQuery += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      queryParams.push(`%${query}%`);
      paramIndex++;
    }
    
    // Add city filter
    if (city) {
      sqlQuery += ` AND c.city ILIKE $${paramIndex}`;
      queryParams.push(`%${city}%`);
      paramIndex++;
    }
    
    // Add rating filter
    if (minRating > 0) {
      sqlQuery += ` AND COALESCE(rs.overall_rating, 0) >= $${paramIndex}`;
      queryParams.push(minRating);
      paramIndex++;
    }
    
    // Add noise level filter
    if (maxNoise < 5) {
      sqlQuery += ` AND c.noise_level <= $${paramIndex}`;
      queryParams.push(maxNoise);
      paramIndex++;
    }
    
    // Add wifi speed filter
    if (minWifi > 0) {
      sqlQuery += ` AND c.wifi_speed >= $${paramIndex}`;
      queryParams.push(minWifi);
      paramIndex++;
    }
    
    // Add amenities filter
    if (amenities.length > 0) {
      sqlQuery += ` AND c.cafe_id IN (
        SELECT cafe_id 
        FROM cafe_amenities 
        JOIN amenities ON cafe_amenities.amenity_id = amenities.amenity_id
        WHERE amenities.name = ANY($${paramIndex}::varchar[])
        GROUP BY cafe_id
        HAVING COUNT(DISTINCT amenities.name) = $${paramIndex + 1}
      )`;
      queryParams.push(amenities);
      queryParams.push(amenities.length);
      paramIndex += 2;
    }
    
    // Add categories filter
    if (categories.length > 0) {
      sqlQuery += ` AND c.cafe_id IN (
        SELECT cafe_id 
        FROM cafe_categories 
        JOIN categories ON cafe_categories.category_id = categories.category_id
        WHERE categories.name = ANY($${paramIndex}::varchar[])
      )`;
      queryParams.push(categories);
      paramIndex++;
    }
    
    // Add open now filter using the current day and time
    if (openNow) {
      sqlQuery += ` AND c.hours->$${paramIndex}->>'open' <= $${paramIndex + 1} 
                 AND c.hours->$${paramIndex}->>'close' >= $${paramIndex + 1}`;
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const now = new Date();
      const dayOfWeek = days[now.getDay()];
      const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
      
      queryParams.push(dayOfWeek);
      queryParams.push(currentTime);
      paramIndex += 2;
    }
    
    // Add sorting and pagination
    sqlQuery += ` ORDER BY rating DESC, name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit);
    queryParams.push(offset);
    
    try {
      const result = await db.query(sqlQuery, queryParams);
      return result.rows;
    } catch (error) {
      console.error('Error searching cafes:', error);
      throw error;
    }
  },

  // Create a new cafe
  async createCafe(cafeData) {
    const {
      name,
      address,
      city,
      state,
      zip_code,
      country,
      latitude,
      longitude,
      phone,
      website,
      description,
      hours,
      wifi_speed,
      wifi_reliability,
      power_outlets,
      noise_level,
      coffee_quality,
      food_quality,
      price_level,
      occupancy_limit,
      amenities = [],
      categories = [],
      images = []
    } = cafeData;
    
    const client = await db.getClient();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Insert cafe
      const cafeResult = await client.query(
        `INSERT INTO cafes (
          name, address, city, state, zip_code, country, latitude, longitude,
          phone, website, description, hours, wifi_speed, wifi_reliability,
          power_outlets, noise_level, coffee_quality, food_quality, price_level, occupancy_limit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING cafe_id`,
        [
          name, address, city, state, zip_code, country, latitude, longitude,
          phone, website, description, JSON.stringify(hours), wifi_speed, wifi_reliability,
          power_outlets, noise_level, coffee_quality, food_quality, price_level, occupancy_limit
        ]
      );
      
      const cafeId = cafeResult.rows[0].cafe_id;
      
      // Add amenities
      if (amenities.length > 0) {
        for (const amenityId of amenities) {
          await client.query(
            'INSERT INTO cafe_amenities (cafe_id, amenity_id) VALUES ($1, $2)',
            [cafeId, amenityId]
          );
        }
      }
      
      // Add categories
      if (categories.length > 0) {
        for (const categoryId of categories) {
          await client.query(
            'INSERT INTO cafe_categories (cafe_id, category_id) VALUES ($1, $2)',
            [cafeId, categoryId]
          );
        }
      }
      
      // Add images
      if (images.length > 0) {
        for (const [index, image] of images.entries()) {
          await client.query(
            'INSERT INTO cafe_images (cafe_id, image_url, caption, is_primary) VALUES ($1, $2, $3, $4)',
            [cafeId, image.url, image.caption || null, index === 0 ? true : false]
          );
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      return cafeId;
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error creating cafe:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Update a cafe
  async updateCafe(cafeId, cafeData) {
    const client = await db.getClient();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Update cafe base data
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;
      
      // Dynamically build the update query
      for (const [key, value] of Object.entries(cafeData)) {
        // Skip related data that needs separate handling
        if (!['amenities', 'categories', 'images'].includes(key)) {
          updateFields.push(`${key} = $${paramIndex}`);
          updateValues.push(value);
          paramIndex++;
        }
      }
      
      if (updateFields.length > 0) {
        await client.query(
          `UPDATE cafes SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE cafe_id = $${paramIndex}`,
          [...updateValues, cafeId]
        );
      }
      
      // Update amenities if provided
      if (cafeData.amenities) {
        // Remove existing amenities
        await client.query('DELETE FROM cafe_amenities WHERE cafe_id = $1', [cafeId]);
        
        // Add new amenities
        for (const amenityId of cafeData.amenities) {
          await client.query(
            'INSERT INTO cafe_amenities (cafe_id, amenity_id) VALUES ($1, $2)',
            [cafeId, amenityId]
          );
        }
      }
      
      // Update categories if provided
      if (cafeData.categories) {
        // Remove existing categories
        await client.query('DELETE FROM cafe_categories WHERE cafe_id = $1', [cafeId]);
        
        // Add new categories
        for (const categoryId of cafeData.categories) {
          await client.query(
            'INSERT INTO cafe_categories (cafe_id, category_id) VALUES ($1, $2)',
            [cafeId, categoryId]
          );
        }
      }
      
      // Update images if provided
      if (cafeData.images) {
        // Remove existing images
        await client.query('DELETE FROM cafe_images WHERE cafe_id = $1', [cafeId]);
        
        // Add new images
        for (const [index, image] of cafeData.images.entries()) {
          await client.query(
            'INSERT INTO cafe_images (cafe_id, image_url, caption, is_primary) VALUES ($1, $2, $3, $4)',
            [cafeId, image.url, image.caption || null, index === 0 || image.is_primary ? true : false]
          );
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      return await this.getCafeById(cafeId);
    } catch (error) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error(`Error updating cafe ${cafeId}:`, error);
      throw error;
    } finally {
      client.release();
    }
  },

  // Delete a cafe
  async deleteCafe(cafeId) {
    try {
      await db.query('DELETE FROM cafes WHERE cafe_id = $1', [cafeId]);
      return true;
    } catch (error) {
      console.error(`Error deleting cafe ${cafeId}:`, error);
      throw error;
    }
  }
};

module.exports = Cafe;
