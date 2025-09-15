const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateGoodTiming, validateTimeSlotChild, validateId, validateDateRange } = require('../middleware/validation');

const router = express.Router();

// Get good timings by date range (accessible to all authenticated users)
router.get('/', authenticateToken, validateDateRange, async (req, res) => {
  try {
    const { start_date, end_date, day } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (start_date) {
      whereClause += ` AND gt.start_date >= $${paramCount++}`;
      values.push(start_date);
    }

    if (end_date) {
      whereClause += ` AND gt.end_date <= $${paramCount++}`;
      values.push(end_date);
    }

    if (day) {
      whereClause += ` AND gt.day = $${paramCount++}`;
      values.push(day);
    }

    const result = await query(
      `SELECT 
         gt.id,
         gt.day,
         gt.start_date,
         gt.end_date,
         gt.created_by,
         gt.created_at,
         gt.updated_at,
         u.name as created_by_name,
         json_agg(
           json_build_object(
             'id', tsc.id,
             'start_time', tsc.start_time,
             'end_time', tsc.end_time,
             'category_id', tsc.category_id,
             'description', tsc.description,
             'category_name', c.name,
             'category_color', c.color_token
           )
         ) as time_slots
       FROM good_timings gt
       LEFT JOIN time_slot_child tsc ON gt.id = tsc.time_slot_id
       LEFT JOIN categories c ON tsc.category_id = c.id
       LEFT JOIN users u ON gt.created_by = u.id
       ${whereClause}
       GROUP BY gt.id, gt.day, gt.start_date, gt.end_date, gt.created_by, gt.created_at, gt.updated_at, u.name
       ORDER BY gt.start_date, gt.day`,
      values
    );

    res.json({
      good_timings: result.rows
    });
  } catch (error) {
    console.error('Get good timings error:', error);
    res.status(500).json({
      error: 'Failed to get good timings',
      message: 'Unable to retrieve good timings'
    });
  }
});

// Get good timing by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
         gt.id,
         gt.day,
         gt.start_date,
         gt.end_date,
         gt.created_by,
         gt.created_at,
         gt.updated_at,
         u.name as created_by_name,
         json_agg(
           json_build_object(
             'id', tsc.id,
             'start_time', tsc.start_time,
             'end_time', tsc.end_time,
             'category_id', tsc.category_id,
             'description', tsc.description,
             'category_name', c.name,
             'category_color', c.color_token
           )
         ) as time_slots
       FROM good_timings gt
       LEFT JOIN time_slot_child tsc ON gt.id = tsc.time_slot_id
       LEFT JOIN categories c ON tsc.category_id = c.id
       LEFT JOIN users u ON gt.created_by = u.id
       WHERE gt.id = $1
       GROUP BY gt.id, gt.day, gt.start_date, gt.end_date, gt.created_by, gt.created_at, gt.updated_at, u.name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Good timing not found',
        message: 'No good timing found with the specified ID'
      });
    }

    res.json({
      good_timing: result.rows[0]
    });
  } catch (error) {
    console.error('Get good timing error:', error);
    res.status(500).json({
      error: 'Failed to get good timing',
      message: 'Unable to retrieve good timing information'
    });
  }
});

// Create new good timing (admin only)
router.post('/', authenticateToken, requireAdmin, validateGoodTiming, async (req, res) => {
  try {
    console.log('Create good timing request body:', req.body);
    const { day, start_date, end_date } = req.body;

    const result = await query(
      `INSERT INTO good_timings (day, start_date, end_date, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, day, start_date, end_date, created_by, created_at, updated_at`,
      [day, start_date, end_date, req.user.id]
    );

    res.status(201).json({
      message: 'Good timing created successfully',
      good_timing: result.rows[0]
    });
  } catch (error) {
    console.error('Create good timing error:', error);
    res.status(500).json({
      error: 'Failed to create good timing',
      message: 'Unable to create new good timing'
    });
  }
});

// Update good timing (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateId, validateGoodTiming, async (req, res) => {
  try {
    const { id } = req.params;
    const { day, start_date, end_date } = req.body;

    const result = await query(
      `UPDATE good_timings 
       SET day = $1, start_date = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 
       RETURNING id, day, start_date, end_date, created_by, created_at, updated_at`,
      [day, start_date, end_date, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Good timing not found',
        message: 'No good timing found with the specified ID'
      });
    }

    res.json({
      message: 'Good timing updated successfully',
      good_timing: result.rows[0]
    });
  } catch (error) {
    console.error('Update good timing error:', error);
    res.status(500).json({
      error: 'Failed to update good timing',
      message: 'Unable to update good timing information'
    });
  }
});

// Delete good timing (admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM good_timings WHERE id = $1 RETURNING id, day',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Good timing not found',
        message: 'No good timing found with the specified ID'
      });
    }

    res.json({
      message: 'Good timing deleted successfully',
      deletedGoodTiming: result.rows[0]
    });
  } catch (error) {
    console.error('Delete good timing error:', error);
    res.status(500).json({
      error: 'Failed to delete good timing',
      message: 'Unable to delete good timing'
    });
  }
});

// Add time slot to good timing (admin only)
router.post('/:id/time-slots', authenticateToken, requireAdmin, validateId, validateTimeSlotChild, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time, category_id, description } = req.body;

    // Verify good timing exists
    const goodTimingCheck = await query(
      'SELECT id FROM good_timings WHERE id = $1',
      [id]
    );

    if (goodTimingCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Good timing not found',
        message: 'No good timing found with the specified ID'
      });
    }

    // Verify category exists and is active
    const categoryCheck = await query(
      'SELECT id FROM categories WHERE id = $1 AND is_active = true',
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category not found or inactive'
      });
    }

    const result = await query(
      `INSERT INTO time_slot_child (time_slot_id, start_time, end_time, category_id, description) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, time_slot_id, start_time, end_time, category_id, description, created_at`,
      [id, start_time, end_time, category_id, description]
    );

    res.status(201).json({
      message: 'Time slot added successfully',
      time_slot: result.rows[0]
    });
  } catch (error) {
    console.error('Add time slot error:', error);
    res.status(500).json({
      error: 'Failed to add time slot',
      message: 'Unable to add time slot to good timing'
    });
  }
});

// Update time slot (admin only)
router.put('/time-slots/:slotId', authenticateToken, requireAdmin, validateTimeSlotChild, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { start_time, end_time, category_id, description } = req.body;

    // Verify time slot exists
    const slotCheck = await query(
      'SELECT id FROM time_slot_child WHERE id = $1',
      [slotId]
    );

    if (slotCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Time slot not found',
        message: 'No time slot found with the specified ID'
      });
    }

    // Verify category exists and is active
    if (category_id) {
      const categoryCheck = await query(
        'SELECT id FROM categories WHERE id = $1 AND is_active = true',
        [category_id]
      );

      if (categoryCheck.rows.length === 0) {
        return res.status(400).json({
          error: 'Invalid category',
          message: 'Category not found or inactive'
        });
      }
    }

    const result = await query(
      `UPDATE time_slot_child 
       SET start_time = COALESCE($1, start_time),
           end_time = COALESCE($2, end_time),
           category_id = COALESCE($3, category_id),
           description = COALESCE($4, description)
       WHERE id = $5 
       RETURNING id, time_slot_id, start_time, end_time, category_id, description, created_at`,
      [start_time, end_time, category_id, description, slotId]
    );

    res.json({
      message: 'Time slot updated successfully',
      time_slot: result.rows[0]
    });
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({
      error: 'Failed to update time slot',
      message: 'Unable to update time slot information'
    });
  }
});

// Delete time slot (admin only)
router.delete('/time-slots/:slotId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { slotId } = req.params;

    const result = await query(
      'DELETE FROM time_slot_child WHERE id = $1 RETURNING id, time_slot_id',
      [slotId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Time slot not found',
        message: 'No time slot found with the specified ID'
      });
    }

    res.json({
      message: 'Time slot deleted successfully',
      deletedTimeSlot: result.rows[0]
    });
  } catch (error) {
    console.error('Delete time slot error:', error);
    res.status(500).json({
      error: 'Failed to delete time slot',
      message: 'Unable to delete time slot'
    });
  }
});

module.exports = router;
