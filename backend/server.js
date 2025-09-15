const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const goodTimingRoutes = require('./routes/goodTimings');
const daylightRoutes = require('./routes/daylight');
const newsletterRoutes = require('./routes/newsletter');
const weatherRoutes = require('./routes/weather');
const calendarRoutes = require('./routes/calendar');
const seedRoutes = require('./routes/seed');
const { query } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Function to initialize database schema
async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database schema...');
    
    // First, check if tables exist
    const tablesCheck = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'categories', 'good_timings', 'time_slot_child', 'daylight', 'newsletter_subscribers', 'calendar_events')
    `);
    
    if (tablesCheck.rows.length > 0) {
      console.log('📋 Database tables already exist, skipping schema initialization');
      console.log('📋 Available tables:', tablesCheck.rows.map(row => row.table_name).join(', '));
      return;
    }
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'scripts', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await query(schemaSQL);
    
    console.log('✅ Database schema initialized successfully!');
    console.log('📋 Default accounts available:');
    console.log('   Admin: admin@dvs.com / admin123');
    console.log('   User:  user@dvs.com / user123');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    
    if (error.code === '28P01') {
      console.log('\n💡 Password authentication failed. Please check your .env file:');
      console.log('   - Make sure DB_PASSWORD is correct');
      console.log('   - Make sure DB_USER has proper permissions');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connection refused. Please check your .env file:');
      console.log('   - Make sure DB_HOST is correct');
      console.log('   - Make sure DB_PORT is correct');
      console.log('   - Make sure PostgreSQL is running');
    } else if (error.code === '3D000') {
      console.log('\n💡 Database does not exist. Please create the database first:');
      console.log('   CREATE DATABASE dvs;');
    }
    
    process.exit(1);
  }
}

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

// Trust proxy for rate limiting (fixes X-Forwarded-For warning)
app.set('trust proxy', 1);


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - more permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://10.89.254.155:3000', // Network IP for mobile testing
      'https://dvs-lyart.vercel.app', // Deployed frontend on Vercel
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow any localhost origin
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400 // Cache preflight for 24 hours
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Additional CORS middleware for extra safety
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers for all responses
  if (origin && (
    origin.includes('localhost') || 
    origin.includes('127.0.0.1') ||
    origin === 'https://dvs-lyart.vercel.app' ||
    origin === process.env.FRONTEND_URL
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Debug middleware to log requests
app.use((req, res, next) => {
  try {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.get('Origin') || 'No Origin'}`);
    next();
  } catch (error) {
    console.error('Error in debug middleware:', error);
    next(); // Continue processing even if logging fails
  }
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Favicon handler - prevent crashes from favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No content, but successful response
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await query('SELECT 1');
    
    res.status(200).json({ 
      status: 'OK', 
      message: 'DVS Backend is running',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      message: 'DVS Backend is running but database is not accessible',
      database: 'Disconnected',
      error: error.message,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/good-timings', goodTimingRoutes);
app.use('/api/daylight', daylightRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/seed', seedRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  try {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation Error',
        details: err.message
      });
    }
    
    if (err.name === 'UnauthorizedError') {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing authentication token'
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  } catch (handlerError) {
    console.error('Error in global error handler:', handlerError);
    // Fallback response if error handler itself fails
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    }
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.log('🔄 Server will continue running...');
  // Don't exit the process, just log the error
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.log('🔄 Server will continue running...');
  // Don't exit the process, just log the error
});

// Handle SIGTERM and SIGINT for graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle other signals that might cause crashes
process.on('SIGHUP', () => {
  console.log('🔄 SIGHUP received, ignoring (server continues running)');
});

process.on('SIGUSR1', () => {
  console.log('🔄 SIGUSR1 received, ignoring (server continues running)');
});

process.on('SIGUSR2', () => {
  console.log('🔄 SIGUSR2 received, ignoring (server continues running)');
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 DVS Backend server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;
