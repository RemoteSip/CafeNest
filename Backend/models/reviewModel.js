const db = require('../database/config');

const Review = {
  // Get reviews for a cafe
  async getCafeReviews(cafeId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await db.query(
        `SELECT r.review_id, r.cafe_id, r.user_id, 
                u.username, u.profile_image,
                r.rating, r.comment, 
                r.wifi_rating, r.power_rating, r.comfort_rating, 
                r.noise_rating, r.coffee_rating, r.food_rating,
                r.created_at, r.updated_at
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.cafe_id = $1
         ORDER BY r.created_at DESC
         LIMIT $2 OFFSET $3`,
        [cafeId, limit, offset]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting reviews for cafe ${cafeId}:`, error);
      throw error;
    }
  },

  // Get a specific review
  async getReviewById(reviewId) {
    try {
      const result = await db.query(
        `SELECT r.review_id, r.cafe_id, r.user_id, 
                u.username, u.profile_image,
                r.rating, r.comment, 
                r.wifi_rating, r.power_rating, r.comfort_rating, 
                r.noise_rating, r.coffee_rating, r.food_rating,
                r.created_at, r.updated_at
         FROM reviews r
         JOIN users u ON r.user_id = u.user_id
         WHERE r.review_id = $1`,
        [reviewId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting review ${reviewId}:`, error);
      throw error;
    }
  },

  // Create a new review
  async createReview(reviewData) {
    const {
      cafe_id,
      user_id,
      rating,
      comment,
      wifi_rating,
      power_rating,
      comfort_rating,
      noise_rating,
      coffee_rating,
      food_rating
    } = reviewData;
    
    try {
      // Check if user has already reviewed this cafe
      const existingReview = await db.query(
        'SELECT review_id FROM reviews WHERE cafe_id = $1 AND user_id = $2',
        [cafe_id, user_id]
      );
      
      if (existingReview.rows.length > 0) {
        throw new Error('User has already reviewed this cafe');
      }
      
      // Insert the review
      const result = await db.query(
        `INSERT INTO reviews (
          cafe_id, user_id, rating, comment, 
          wifi_rating, power_rating, comfort_rating, 
          noise_rating, coffee_rating, food_rating
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING review_id`,
        [
          cafe_id,
          user_id,
          rating,
          comment,
          wifi_rating,
          power_rating,
          comfort_rating,
          noise_rating,
          coffee_rating,
          food_rating
        ]
      );
      
      const reviewId = result.rows[0].review_id;
      return await this.getReviewById(reviewId);
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Update a review
  async updateReview(reviewId, reviewData, userId) {
    const {
      rating,
      comment,
      wifi_rating,
      power_rating,
      comfort_rating,
      noise_rating,
      coffee_rating,
      food_rating
    } = reviewData;
    
    try {
      // Verify the review belongs to the user
      const reviewCheck = await db.query(
        'SELECT user_id FROM reviews WHERE review_id = $1',
        [reviewId]
      );
      
      if (reviewCheck.rows.length === 0) {
        throw new Error('Review not found');
      }
      
      if (reviewCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s review');
      }
      
      // Update the review
      await db.query(
        `UPDATE reviews 
         SET rating = $1,
             comment = $2,
             wifi_rating = $3,
             power_rating = $4,
             comfort_rating = $5,
             noise_rating = $6,
             coffee_rating = $7,
             food_rating = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE review_id = $9`,
        [
          rating,
          comment,
          wifi_rating,
          power_rating,
          comfort_rating,
          noise_rating,
          coffee_rating,
          food_rating,
          reviewId
        ]
      );
      
      return await this.getReviewById(reviewId);
    } catch (error) {
      console.error(`Error updating review ${reviewId}:`, error);
      throw error;
    }
  },

  // Delete a review
  async deleteReview(reviewId, userId) {
    try {
      // Verify the review belongs to the user or user is admin
      const reviewCheck = await db.query(
        'SELECT user_id FROM reviews WHERE review_id = $1',
        [reviewId]
      );
      
      if (reviewCheck.rows.length === 0) {
        throw new Error('Review not found');
      }
      
      if (reviewCheck.rows[0].user_id !== userId) {
        // In a real app, check if user is admin here
        throw new Error('Unauthorized: Cannot delete another user\'s review');
      }
      
      await db.query('DELETE FROM reviews WHERE review_id = $1', [reviewId]);
      return true;
    } catch (error) {
      console.error(`Error deleting review ${reviewId}:`, error);
      throw error;
    }
  },

  // Get review statistics for a cafe
  async getCafeReviewStats(cafeId) {
    try {
      const result = await db.query(
        `SELECT 
           COUNT(*) AS total_reviews,
           ROUND(AVG(rating), 1) AS average_rating,
           ROUND(AVG(wifi_rating), 1) AS average_wifi_rating,
           ROUND(AVG(power_rating), 1) AS average_power_rating,
           ROUND(AVG(comfort_rating), 1) AS average_comfort_rating,
           ROUND(AVG(noise_rating), 1) AS average_noise_rating,
           ROUND(AVG(coffee_rating), 1) AS average_coffee_rating,
           ROUND(AVG(food_rating), 1) AS average_food_rating,
           COUNT(*) FILTER (WHERE rating = 5) AS five_star_count,
           COUNT(*) FILTER (WHERE rating = 4) AS four_star_count,
           COUNT(*) FILTER (WHERE rating = 3) AS three_star_count,
           COUNT(*) FILTER (WHERE rating = 2) AS two_star_count,
           COUNT(*) FILTER (WHERE rating = 1) AS one_star_count
         FROM reviews
         WHERE cafe_id = $1`,
        [cafeId]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting review stats for cafe ${cafeId}:`, error);
      throw error;
    }
  }
};

module.exports = Review;
