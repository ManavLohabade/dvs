const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateDaylight, validateId, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// Helper function to maintain only the last 7 daylight records
const cleanupOldRecords = async () => {
  try {
    // Get all daylight records ordered by date (newest first)
    const allRecords = await query(
      'SELECT id, date FROM daylight ORDER BY date DESC'
    );

    // If we have more than 7 records, delete the oldest ones
    if (allRecords.rows.length > 7) {
      const recordsToDelete = allRecords.rows.slice(7); // Get records beyond the first 7
      const idsToDelete = recordsToDelete.map(record => record.id);
      
      if (idsToDelete.length > 0) {
        await query(
          `DELETE FROM daylight WHERE id = ANY($1)`,
          [idsToDelete]
        );
        console.log(`Cleaned up ${idsToDelete.length} old daylight records`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old daylight records:', error);
  }
};

// Get daylight data - returns last 7 records by default, or by date range if specified
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;
    let limitClause = '';

    if (start_date && end_date) {
      // If date range is specified, use it
      whereClause += ` AND date >= $${paramCount++}`;
      values.push(start_date);
      whereClause += ` AND date <= $${paramCount++}`;
      values.push(end_date);
    } else {
      // If no date range specified, return last 7 records
      limitClause = 'LIMIT 7';
    }

    const result = await query(
      `SELECT 
         d.id,
         d.date,
         d.sunrise_time,
         d.sunset_time,
         d.timezone,
         d.notes,
         d.updated_by,
         d.updated_at,
         u.name as updated_by_name
       FROM daylight d
       LEFT JOIN users u ON d.updated_by = u.id
       ${whereClause}
       ORDER BY d.date DESC
       ${limitClause}`,
      values
    );

    // If using limit, keep the order as newest to oldest (no reverse needed)
    const daylight = result.rows;

    res.json({
      daylight
    });
  } catch (error) {
    console.error('Get daylight error:', error);
    res.status(500).json({
      error: 'Failed to get daylight data',
      message: 'Unable to retrieve daylight information'
    });
  }
});

// Get daylight data by specific date (accessible to all authenticated users)
router.get('/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    const result = await query(
      `SELECT 
         d.id,
         d.date,
         d.sunrise_time,
         d.sunset_time,
         d.timezone,
         d.notes,
         d.updated_by,
         d.updated_at,
         u.name as updated_by_name
       FROM daylight d
       LEFT JOIN users u ON d.updated_by = u.id
       WHERE d.date = $1`,
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Daylight data not found',
        message: 'No daylight data found for the specified date'
      });
    }

    res.json({
      daylight: result.rows[0]
    });
  } catch (error) {
    console.error('Get daylight by date error:', error);
    res.status(500).json({
      error: 'Failed to get daylight data',
      message: 'Unable to retrieve daylight information'
    });
  }
});

// Create or update daylight data (admin only)
router.put('/:date', authenticateToken, requireAdmin, validateDaylight, async (req, res) => {
  try {
    const { date } = req.params;
    const { sunrise_time, sunset_time, timezone = 'Asia/Kolkata', notes } = req.body;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    // Check if daylight data already exists for this date
    const existingData = await query(
      'SELECT id FROM daylight WHERE date = $1',
      [date]
    );

    let result;
    if (existingData.rows.length > 0) {
      // Update existing record
      result = await query(
        `UPDATE daylight 
         SET sunrise_time = $1, sunset_time = $2, timezone = $3, notes = $4, 
             updated_by = $5, updated_at = CURRENT_TIMESTAMP
         WHERE date = $6 
         RETURNING id, date, sunrise_time, sunset_time, timezone, notes, updated_by, updated_at`,
        [sunrise_time, sunset_time, timezone, notes, req.user.id, date]
      );
    } else {
      // Create new record
      result = await query(
        `INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, notes, updated_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, date, sunrise_time, sunset_time, timezone, notes, updated_by, updated_at`,
        [date, sunrise_time, sunset_time, timezone, notes, req.user.id]
      );
    }

    // Clean up old records to maintain only the last 7
    await cleanupOldRecords();

    res.json({
      message: existingData.rows.length > 0 ? 'Daylight data updated successfully' : 'Daylight data created successfully',
      daylight: result.rows[0]
    });
  } catch (error) {
    console.error('Create/update daylight error:', error);
    res.status(500).json({
      error: 'Failed to save daylight data',
      message: 'Unable to save daylight information'
    });
  }
});

// Delete all daylight data (admin only)
router.delete('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'DELETE FROM daylight RETURNING id, date',
      []
    );

    res.json({
      message: `Successfully deleted ${result.rows.length} daylight entries`,
      deletedCount: result.rows.length,
      deletedEntries: result.rows
    });
  } catch (error) {
    console.error('Delete all daylight error:', error);
    res.status(500).json({
      error: 'Failed to delete all daylight data',
      message: 'Unable to clear daylight information'
    });
  }
});

// Delete daylight data (admin only)
router.delete('/:date', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    const result = await query(
      'DELETE FROM daylight WHERE date = $1 RETURNING id, date',
      [date]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Daylight data not found',
        message: 'No daylight data found for the specified date'
      });
    }

    res.json({
      message: 'Daylight data deleted successfully',
      deletedDaylight: result.rows[0]
    });
  } catch (error) {
    console.error('Delete daylight error:', error);
    res.status(500).json({
      error: 'Failed to delete daylight data',
      message: 'Unable to delete daylight information'
    });
  }
});

// Bulk update daylight data for a date range (admin only)
router.put('/bulk', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { daylight_data } = req.body;

    if (!Array.isArray(daylight_data) || daylight_data.length === 0) {
      return res.status(400).json({
        error: 'Invalid data',
        message: 'daylight_data must be a non-empty array'
      });
    }

    const results = [];
    
    for (const data of daylight_data) {
      const { date, sunrise_time, sunset_time, timezone = 'Asia/Kolkata', notes } = data;

      // Validate required fields
      if (!date || !sunrise_time || !sunset_time) {
        return res.status(400).json({
          error: 'Invalid data',
          message: 'Each daylight entry must have date, sunrise_time, and sunset_time'
        });
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          error: 'Invalid date format',
          message: 'Date must be in YYYY-MM-DD format'
        });
      }

      // Validate time format
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sunrise_time) || 
          !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(sunset_time)) {
        return res.status(400).json({
          error: 'Invalid time format',
          message: 'Times must be in HH:MM format'
        });
      }

      // Check if sunrise is before sunset
      if (sunrise_time >= sunset_time) {
        return res.status(400).json({
          error: 'Invalid time range',
          message: 'Sunrise time must be before sunset time'
        });
      }

      // Check if daylight data already exists for this date
      const existingData = await query(
        'SELECT id FROM daylight WHERE date = $1',
        [date]
      );

      let result;
      if (existingData.rows.length > 0) {
        // Update existing record
        result = await query(
          `UPDATE daylight 
           SET sunrise_time = $1, sunset_time = $2, timezone = $3, notes = $4, 
               updated_by = $5, updated_at = CURRENT_TIMESTAMP
           WHERE date = $6 
           RETURNING id, date, sunrise_time, sunset_time, timezone, notes, updated_by, updated_at`,
          [sunrise_time, sunset_time, timezone, notes, req.user.id, date]
        );
      } else {
        // Create new record
        result = await query(
          `INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, notes, updated_by) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING id, date, sunrise_time, sunset_time, timezone, notes, updated_by, updated_at`,
          [date, sunrise_time, sunset_time, timezone, notes, req.user.id]
        );
      }

      results.push(result.rows[0]);
    }

    // Clean up old records to maintain only the last 7
    await cleanupOldRecords();

    res.json({
      message: 'Bulk daylight data update completed successfully',
      daylight: results
    });
  } catch (error) {
    console.error('Bulk update daylight error:', error);
    res.status(500).json({
      error: 'Failed to bulk update daylight data',
      message: 'Unable to update daylight information'
    });
  }
});

// Admin-only routes for daylight management
router.get('/admin/all', authenticateToken, requireAdmin, validateDateRange, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (start_date) {
      whereClause += ` AND date >= $${paramCount++}`;
      values.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND date <= $${paramCount++}`;
      values.push(end_date);
    }

    const result = await query(
      `SELECT 
         d.id,
         d.date,
         d.sunrise_time,
         d.sunset_time,
         d.timezone,
         d.notes,
         d.updated_by,
         d.updated_at,
         u.name as updated_by_name
       FROM daylight d
       LEFT JOIN users u ON d.updated_by = u.id
       ${whereClause}
       ORDER BY d.date`,
      values
    );

    res.json({
      daylight: result.rows
    });
  } catch (error) {
    console.error('Get admin daylight error:', error);
    res.status(500).json({
      error: 'Failed to get daylight data',
      message: 'Unable to retrieve daylight information'
    });
  }
});

module.exports = router;
