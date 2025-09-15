const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateCategory, validateCategoryUpdate, validateId } = require('../middleware/validation');

const router = express.Router();

// Get all categories (accessible to all authenticated users)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, color_token, is_active, created_at 
       FROM categories 
       WHERE is_active = true 
       ORDER BY name ASC`
    );

    res.json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to get categories',
      message: 'Unable to retrieve categories'
    });
  }
});

// Get all categories including inactive (admin only)
router.get('/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, color_token, is_active, created_at 
       FROM categories 
       ORDER BY is_active DESC, name ASC`
    );

    res.json({
      categories: result.rows
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      error: 'Failed to get categories',
      message: 'Unable to retrieve categories'
    });
  }
});

// Get category by ID
router.get('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id, name, color_token, is_active, created_at 
       FROM categories 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'No category found with the specified ID'
      });
    }

    res.json({
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to get category',
      message: 'Unable to retrieve category information'
    });
  }
});

// Create new category (admin only)
router.post('/', authenticateToken, requireAdmin, validateCategory, async (req, res) => {
  try {
    const { name, color_token } = req.body;

    // Check if category already exists
    const existingCategory = await query(
      'SELECT id FROM categories WHERE name = $1',
      [name]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        error: 'Category already exists',
        message: 'A category with this name already exists'
      });
    }

    const result = await query(
      `INSERT INTO categories (name, color_token) 
       VALUES ($1, $2) 
       RETURNING id, name, color_token, is_active, created_at`,
      [name, color_token]
    );

    res.status(201).json({
      message: 'Category created successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      error: 'Failed to create category',
      message: 'Unable to create new category'
    });
  }
});

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, validateId, validateCategoryUpdate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color_token, is_active } = req.body;

    // Check if category exists
    const existingCategory = await query(
      'SELECT id FROM categories WHERE id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'No category found with the specified ID'
      });
    }

    // Check if name is already taken by another category
    if (name) {
      const nameCheck = await query(
        'SELECT id FROM categories WHERE name = $1 AND id != $2',
        [name, id]
      );

      if (nameCheck.rows.length > 0) {
        return res.status(400).json({
          error: 'Category name already exists',
          message: 'A category with this name already exists'
        });
      }
    }

    const result = await query(
      `UPDATE categories 
       SET name = COALESCE($1, name), 
           color_token = COALESCE($2, color_token),
           is_active = COALESCE($3, is_active)
       WHERE id = $4 
       RETURNING id, name, color_token, is_active, created_at`,
      [name, color_token, is_active, id]
    );

    res.json({
      message: 'Category updated successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      error: 'Failed to update category',
      message: 'Unable to update category information'
    });
  }
});

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is being used by any time slots
    const usageCheck = await query(
      'SELECT COUNT(*) as count FROM time_slot_child WHERE category_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Category in use',
        message: 'Cannot delete category that is being used by time slots'
      });
    }

    const result = await query(
      'DELETE FROM categories WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Category not found',
        message: 'No category found with the specified ID'
      });
    }

    res.json({
      message: 'Category deleted successfully',
      deletedCategory: result.rows[0]
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Failed to delete category',
      message: 'Unable to delete category'
    });
  }
});

module.exports = router;
