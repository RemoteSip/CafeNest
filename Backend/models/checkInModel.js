const db = require('../database/config');

const CheckIn = {
  // Get active check-ins for a cafe
  async getActiveCafeCheckIns(cafeId) {
    try {
      const result = await db.query(
        `SELECT ci.check_in_id, ci.user_id, u.username, u.profile_image,
                ci.check_in_time, ci.occupancy_report
         FROM check_ins ci
         JOIN users u ON ci.user_id = u.user_id
         WHERE ci.cafe_id = $1 AND ci.status = 'active' AND ci.check_out_time IS NULL
         ORDER BY ci.check_in_time DESC`,
        [cafeId]
      );
      
      return result.rows;
    } catch (error) {
      console.error(`Error getting active check-ins for cafe ${cafeId}:`, error);
      throw error;
    }
  },

  // Get a specific check-in
  async getCheckInById(checkInId) {
    try {
      const result = await db.query(
        `SELECT ci.check_in_id, ci.cafe_id, ci.user_id, 
                u.username, u.profile_image,
                c.name AS cafe_name,
                ci.check_in_time, ci.check_out_time, 
                ci.status, ci.occupancy_report
         FROM check_ins ci
         JOIN users u ON ci.user_id = u.user_id
         JOIN cafes c ON ci.cafe_id = c.cafe_id
         WHERE ci.check_in_id = $1`,
        [checkInId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting check-in ${checkInId}:`, error);
      throw error;
    }
  },

  // Create a new check-in
  async createCheckIn(cafeId, userId, occupancyReport = null) {
    try {
      // Check if user is already checked in somewhere
      const activeCheckIn = await db.query(
        `SELECT check_in_id FROM check_ins 
         WHERE user_id = $1 AND status = 'active' AND check_out_time IS NULL`,
        [userId]
      );
      
      if (activeCheckIn.rows.length > 0) {
        // Automatically check out from previous location
        await this.checkOut(activeCheckIn.rows[0].check_in_id);
      }
      
      // Create new check-in
      const result = await db.query(
        `INSERT INTO check_ins (cafe_id, user_id, occupancy_report)
         VALUES ($1, $2, $3)
         RETURNING check_in_id`,
        [cafeId, userId, occupancyReport]
      );
      
      const checkInId = result.rows[0].check_in_id;
      return await this.getCheckInById(checkInId);
    } catch (error) {
      console.error(`Error creating check-in for user ${userId} at cafe ${cafeId}:`, error);
      throw error;
    }
  },

  // Check out (end a check-in session)
  async checkOut(checkInId) {
    try {
      const result = await db.query(
        `UPDATE check_ins 
         SET check_out_time = CURRENT_TIMESTAMP,
             status = 'completed'
         WHERE check_in_id = $1 AND status = 'active'
         RETURNING check_in_id`,
        [checkInId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('Check-in not found or already ended');
      }
      
      return await this.getCheckInById(checkInId);
    } catch (error) {
      console.error(`Error checking out from check-in ${checkInId}:`, error);
      throw error;
    }
  },

  // Get user's current active check-in
  async getUserActiveCheckIn(userId) {
    try {
      const result = await db.query(
        `SELECT ci.check_in_id, ci.cafe_id, c.name AS cafe_name,
                ci.check_in_time, ci.occupancy_report,
                (
                  SELECT image_url 
                  FROM cafe_images 
                  WHERE cafe_id = c.cafe_id AND is_primary = true 
                  LIMIT 1
                ) AS cafe_image
         FROM check_ins ci
         JOIN cafes c ON ci.cafe_id = c.cafe_id
         WHERE ci.user_id = $1 AND ci.status = 'active' AND ci.check_out_time IS NULL`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error(`Error getting active check-in for user ${userId}:`, error);
      throw error;
    }
  },

  // Update occupancy report
  async updateOccupancyReport(checkInId, occupancyReport, userId) {
    try {
      // Verify the check-in belongs to the user
      const checkInCheck = await db.query(
        'SELECT user_id FROM check_ins WHERE check_in_id = $1',
        [checkInId]
      );
      
      if (checkInCheck.rows.length === 0) {
        throw new Error('Check-in not found');
      }
      
      if (checkInCheck.rows[0].user_id !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s check-in');
      }
      
      await db.query(
        `UPDATE check_ins 
         SET occupancy_report = $1
         WHERE check_in_id = $2`,
        [occupancyReport, checkInId]
      );
      
      return await this.getCheckInById(checkInId);
    } catch (error) {
      console.error(`Error updating occupancy report for check-in ${checkInId}:`, error);
      throw error;
    }
  },

  // Get occupancy data for a cafe
  async getCafeOccupancyData(cafeId) {
    try {
      // Current occupancy
      const currentResult = await db.query(
        `SELECT COUNT(*) AS active_users
         FROM check_ins
         WHERE cafe_id = $1 AND status = 'active' AND check_out_time IS NULL`,
        [cafeId]
      );
      
      // Get cafe occupancy limit
      const limitResult = await db.query(
        'SELECT occupancy_limit FROM cafes WHERE cafe_id = $1',
        [cafeId]
      );
      
      const occupancyLimit = limitResult.rows[0]?.occupancy_limit || 0;
      const activeUsers = parseInt(currentResult.rows[0].active_users);
      
      // Calculate occupancy percentage
      const occupancyPercentage = occupancyLimit > 0 
        ? Math.round((activeUsers / occupancyLimit) * 100)
        : 0;
        
      // Get historical data (hourly averages for the past week)
      const historicalResult = await db.query(
        `SELECT 
           EXTRACT(DOW FROM check_in_time) AS day_of_week,
           EXTRACT(HOUR FROM check_in_time) AS hour_of_day,
           COUNT(*) AS check_in_count
         FROM check_ins
         WHERE cafe_id = $1 
           AND check_in_time > CURRENT_TIMESTAMP - INTERVAL '7 days'
         GROUP BY day_of_week, hour_of_day
         ORDER BY day_of_week, hour_of_day`,
        [cafeId]
      );
      
      return {
        active_users: activeUsers,
        occupancy_limit: occupancyLimit,
        occupancy_percentage: occupancyPercentage,
        historical_data: historicalResult.rows
      };
    } catch (error) {
      console.error(`Error getting occupancy data for cafe ${cafeId}:`, error);
      throw error;
    }
  }
};

module.exports = CheckIn;
