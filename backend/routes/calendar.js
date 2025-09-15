const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

// Calendar event validation rules
const validateCalendarEvent = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('start_date')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('end_date')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('start_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  body('is_all_day')
    .optional()
    .isBoolean()
    .withMessage('Is all day must be a boolean value'),
  body('color')
    .optional()
    .isIn(['blue', 'green', 'teal', 'amber', 'red', 'yellow', 'orange', 'purple', 'pink'])
    .withMessage('Color must be one of: blue, green, teal, amber, red, yellow, orange, purple, pink'),
  handleValidationErrors
];

// Get all calendar events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    
    let queryText = `
      SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.start_date,
        ce.end_date,
        ce.start_time,
        ce.end_time,
        ce.is_all_day,
        ce.color,
        ce.created_at,
        ce.updated_at,
        ce.created_by,
        u.name as created_by_name,
        c.name as category_name,
        c.color_token as category_color
      FROM calendar_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      LEFT JOIN categories c ON ce.category_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    if (start_date) {
      paramCount++;
      queryText += ` AND ce.start_date >= $${paramCount}`;
      queryParams.push(start_date);
    }
    
    if (end_date) {
      paramCount++;
      queryText += ` AND ce.end_date <= $${paramCount}`;
      queryParams.push(end_date);
    }
    
    if (category_id) {
      paramCount++;
      queryText += ` AND ce.category_id = $${paramCount}`;
      queryParams.push(category_id);
    }
    
    queryText += ` ORDER BY ce.start_date, ce.start_time`;
    
    console.log('Fetching calendar events with query:', queryText);
    console.log('Query parameters:', queryParams);
    
    const result = await query(queryText, queryParams);
    
    console.log('Fetched calendar events:', result.rows.length, 'events');
    result.rows.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        start_date: event.start_date,
        end_date: event.end_date
      });
    });
    
    res.json({
      success: true,
      events: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar events',
      message: 'Unable to retrieve calendar events'
    });
  }
});

// Get single calendar event
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(`
      SELECT 
        ce.id,
        ce.title,
        ce.description,
        ce.start_date,
        ce.end_date,
        ce.start_time,
        ce.end_time,
        ce.is_all_day,
        ce.color,
        ce.created_at,
        ce.updated_at,
        ce.created_by,
        u.name as created_by_name,
        c.name as category_name,
        c.color_token as category_color
      FROM calendar_events ce
      LEFT JOIN users u ON ce.created_by = u.id
      LEFT JOIN categories c ON ce.category_id = c.id
      WHERE ce.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'Calendar event does not exist'
      });
    }
    
    res.json({
      success: true,
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({
      error: 'Failed to fetch calendar event',
      message: 'Unable to retrieve calendar event'
    });
  }
});

// Create new calendar event
router.post('/', authenticateToken, validateCalendarEvent, async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      category_id,
      is_all_day = false,
      color = 'blue'
    } = req.body;
    
    const userId = req.user.id;
    
    console.log('Creating calendar event with data:', {
      title, description, start_date, end_date, start_time, end_time,
      category_id, is_all_day, color, userId
    });
    
    // Debug: Check if dates are valid
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    console.log('Date validation:', {
      start_date_original: start_date,
      start_date_parsed: startDateObj.toISOString(),
      end_date_original: end_date,
      end_date_parsed: endDateObj.toISOString(),
      start_date_valid: !isNaN(startDateObj.getTime()),
      end_date_valid: !isNaN(endDateObj.getTime())
    });
    
    const result = await query(`
      INSERT INTO calendar_events (
        title, description, start_date, end_date, start_time, end_time,
        category_id, is_all_day, color, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      title, description, start_date, end_date, start_time, end_time,
      category_id, is_all_day, color, userId
    ]);
    
    console.log('Created calendar event:', result.rows[0]);
    
    res.status(201).json({
      success: true,
      message: 'Calendar event created successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      error: 'Failed to create calendar event',
      message: 'Unable to create calendar event'
    });
  }
});

// Update calendar event
router.put('/:id', authenticateToken, validateCalendarEvent, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      category_id,
      is_all_day,
      color
    } = req.body;
    
    const userId = req.user.id;
    
    // Check if event exists and user has permission
    const checkResult = await query(`
      SELECT created_by FROM calendar_events WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'Calendar event does not exist'
      });
    }
    
    // Check if user is admin or event creator
    if (req.user.role !== 'admin' && checkResult.rows[0].created_by !== userId) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only edit your own events'
      });
    }
    
    const result = await query(`
      UPDATE calendar_events SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        start_date = COALESCE($3, start_date),
        end_date = COALESCE($4, end_date),
        start_time = COALESCE($5, start_time),
        end_time = COALESCE($6, end_time),
        category_id = COALESCE($7, category_id),
        is_all_day = COALESCE($8, is_all_day),
        color = COALESCE($9, color),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      title, description, start_date, end_date, start_time, end_time,
      category_id, is_all_day, color, id
    ]);
    
    res.json({
      success: true,
      message: 'Calendar event updated successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      error: 'Failed to update calendar event',
      message: 'Unable to update calendar event'
    });
  }
});

// Delete calendar event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if event exists and user has permission
    const checkResult = await query(`
      SELECT created_by FROM calendar_events WHERE id = $1
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Event not found',
        message: 'Calendar event does not exist'
      });
    }
    
    // Check if user is admin or event creator
    if (req.user.role !== 'admin' && checkResult.rows[0].created_by !== userId) {
      return res.status(403).json({
        error: 'Permission denied',
        message: 'You can only delete your own events'
      });
    }
    
    await query('DELETE FROM calendar_events WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Calendar event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      error: 'Failed to delete calendar event',
      message: 'Unable to delete calendar event'
    });
  }
});

// Get calendar event categories
router.get('/categories/list', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, name, color_token, is_active
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC
    `);
    
    res.json({
      success: true,
      categories: result.rows
    });
  } catch (error) {
    console.error('Error fetching calendar categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: 'Unable to retrieve calendar categories'
    });
  }
});

module.exports = router;
