const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone_number')
    .optional()
    .isMobilePhone()
    .withMessage('Valid phone number is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Category validation rules
const validateCategory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('color_token')
    .isIn(['blue', 'green', 'teal', 'amber'])
    .withMessage('Color token must be one of: blue, green, teal, amber'),
  handleValidationErrors
];

// Category update validation rules (for partial updates)
const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('color_token')
    .optional()
    .isIn(['blue', 'green', 'teal', 'amber'])
    .withMessage('Color token must be one of: blue, green, teal, amber'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value'),
  handleValidationErrors
];

// Good timing validation rules
const validateGoodTiming = [
  body('day')
    .custom((value) => {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      return validDays.includes(value.toLowerCase());
    })
    .withMessage('Day must be a valid day of the week'),
  body('start_date')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('Start date must be a valid date'),
  body('end_date')
    .custom((value) => {
      const date = new Date(value);
      return !isNaN(date.getTime());
    })
    .withMessage('End date must be a valid date'),
  body('start_date')
    .custom((value, { req }) => {
      if (new Date(value) > new Date(req.body.end_date)) {
        throw new Error('Start date must be before or equal to end date');
      }
      return true;
    }),
  handleValidationErrors
];

// Time slot child validation rules
const validateTimeSlotChild = [
  body('start_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('end_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('start_time')
    .custom((value, { req }) => {
      if (value >= req.body.end_time) {
        throw new Error('Start time must be before end time');
      }
      return true;
    }),
  body('category_id')
    .isInt({ min: 1 })
    .withMessage('Valid category ID is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  handleValidationErrors
];

// Daylight validation rules
const validateDaylight = [
  body('sunrise_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Sunrise time must be in HH:MM or HH:MM:SS format'),
  body('sunset_time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Sunset time must be in HH:MM or HH:MM:SS format'),
  body('sunrise_time')
    .custom((value, { req }) => {
      if (value && req.body.sunset_time) {
        // Convert times to comparable format (remove seconds if present)
        const sunrise = value.includes(':') ? value.split(':').slice(0, 2).join(':') : value;
        const sunset = req.body.sunset_time.includes(':') ? req.body.sunset_time.split(':').slice(0, 2).join(':') : req.body.sunset_time;
        
        if (sunrise >= sunset) {
          throw new Error('Sunrise time must be before sunset time');
        }
      }
      return true;
    }),
  body('timezone')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Timezone must be between 3 and 50 characters'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  handleValidationErrors
];

// Parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
  handleValidationErrors
];

// Query validation for date ranges
const validateDateRange = [
  query('start_date')
    .optional()
    .isDate()
    .withMessage('Start date must be a valid date'),
  query('end_date')
    .optional()
    .isDate()
    .withMessage('End date must be a valid date'),
  query('start_date')
    .optional()
    .custom((value, { req }) => {
      if (value && req.query.end_date && new Date(value) > new Date(req.query.end_date)) {
        throw new Error('Start date must be before or equal to end date');
      }
      return true;
    }),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateCategory,
  validateCategoryUpdate,
  validateGoodTiming,
  validateTimeSlotChild,
  validateDaylight,
  validateId,
  validateDateRange
};
