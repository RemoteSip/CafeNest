const db = require('../database/config');
const bcrypt = require('bcrypt');

const User = {
  // Get user by ID
  async getUserById(userId) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, first_name, last_name, 
                profile_image, bio, is_verified, created_at, updated_at
         FROM users
         WHERE user_id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting user with ID ${userId}:`, error);
      throw error;
    }
  },

  // Get user by username
  async getUserByUsername(username) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, first_name, last_name, 
                profile_image, bio, is_verified, created_at, updated_at
         FROM users
         WHERE username = $1`,
        [username]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting user with username ${username}:`, error);
      throw error;
    }
  },

  // Get user by email
  async getUserByEmail(email) {
    try {
      const result = await db.query(
        `SELECT user_id, username, email, password_hash, first_name, last_name, 
                profile_image, bio, is_verified, created_at, updated_at
         FROM users
         WHERE email = $1`,
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting user with email ${email}:`, error);
      throw error;
    }
  },

  // Create a new user
  async createUser(userData) {
    const { username, email, password, first_name, last_name, profile_image, bio } = userData;
    
    try {
      // Hash the password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);
      
      // Insert the user
      const result = await db.query(
        `INSERT INTO users (
          username, email, password_hash, first_name, last_name, profile_image, bio
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING user_id, username, email, first_name, last_name, profile_image, bio, is_verified, created_at, updated_at`,
        [username, email, password_hash, first_name, last_name, profile_image, bio]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update a user
  async updateUser(userId, userData) {
    const { username, email, first_name, last_name, profile_image, bio } = userData;
    
    try {
      const result = await db.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             email = COALESCE($2, email),
             first_name = COALESCE($3, first_name),
             last_name = COALESCE($4, last_name),
             profile_image = COALESCE($5, profile_image),
             bio = COALESCE($6, bio),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7
         RETURNING user_id, username, email, first_name, last_name, profile_image, bio, is_verified, created_at, updated_at`,
        [username, email, first_name, last_name, profile_image, bio, userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  // Change password
  async changePassword(userId, newPassword) {
    try {
      // Hash the new password
      const saltRounds = 10;
      const password_hash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the password
      await db.query(
        `UPDATE users 
         SET password_hash = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $2`,
        [password_hash, userId]
      );
      
      return true;
    } catch (error) {
      console.error(`Error changing password for user ${userId}:`, error);
      throw error;
    }
  },

  // Verify a user's password
  async verifyPassword(userId, password) {
    try {
      const result = await db.query(
        'SELECT password_hash FROM users WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      const { password_hash } = result.rows[0];
      return await bcrypt.compare(password, password_hash);
    } catch (error) {
      console.error(`Error verifying password for user ${userId}:`, error);
      throw error;
    }
  },

  // Delete a user
  async deleteUser(userId) {
    try {
      await db.query('DELETE FROM users WHERE user_id = $1', [userId]);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  // Get user's favorite cafes
  async getUserFavorites(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
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
                f.created_at AS favorited_at
         FROM favorites f
         JOIN cafes c ON f.cafe_id = c.cafe_id
         LEFT JOIN cafe_rating_summary rs ON c.cafe_id = rs.cafe_id
         LEFT JOIN current_occupancy co ON c.cafe_id = co.cafe_id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting favorites for user ${userId}:`, error);
      throw error;
    }
  },

  // Add cafe to favorites
  async addFavorite(userId, cafeId) {
    try {
      await db.query(
        'INSERT INTO favorites (user_id, cafe_id) VALUES ($1, $2) ON CONFLICT (user_id, cafe_id) DO NOTHING',
        [userId, cafeId]
      );
      return true;
    } catch (error) {
      console.error(`Error adding cafe ${cafeId} to favorites for user ${userId}:`, error);
      throw error;
    }
  },

  // Remove cafe from favorites
  async removeFavorite(userId, cafeId) {
    try {
      await db.query(
        'DELETE FROM favorites WHERE user_id = $1 AND cafe_id = $2',
        [userId, cafeId]
      );
      return true;
    } catch (error) {
      console.error(`Error removing cafe ${cafeId} from favorites for user ${userId}:`, error);
      throw error;
    }
  },

  // Check if cafe is in user's favorites
  async isFavorite(userId, cafeId) {
    try {
      const result = await db.query(
        'SELECT 1 FROM favorites WHERE user_id = $1 AND cafe_id = $2',
        [userId, cafeId]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error(`Error checking if cafe ${cafeId} is favorite for user ${userId}:`, error);
      throw error;
    }
  },

  // Get user's check-in history
  async getUserCheckIns(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await db.query(
        `SELECT ci.check_in_id, ci.cafe_id, c.name AS cafe_name, 
                ci.check_in_time, ci.check_out_time, ci.status, ci.occupancy_report,
                (
                  SELECT image_url 
                  FROM cafe_images 
                  WHERE cafe_id = c.cafe_id AND is_primary = true 
                  LIMIT 1
                ) AS cafe_image
         FROM check_ins ci
         JOIN cafes c ON ci.cafe_id = c.cafe_id
         WHERE ci.user_id = $1
         ORDER BY ci.check_in_time DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting check-ins for user ${userId}:`, error);
      throw error;
    }
  },

  // Get user's review history
  async getUserReviews(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await db.query(
        `SELECT r.review_id, r.cafe_id, c.name AS cafe_name, 
                r.rating, r.comment, r.created_at,
                r.wifi_rating, r.power_rating, r.comfort_rating, 
                r.noise_rating, r.coffee_rating, r.food_rating,
                (
                  SELECT image_url 
                  FROM cafe_images 
                  WHERE cafe_id = c.cafe_id AND is_primary = true 
                  LIMIT 1
                ) AS cafe_image
         FROM reviews r
         JOIN cafes c ON r.cafe_id = c.cafe_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting reviews for user ${userId}:`, error);
      throw error;
    }
  }
};

module.exports = User;