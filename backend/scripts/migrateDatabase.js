const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dvs',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Dashboard@123',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(dbConfig);

async function migrateDatabase() {
  try {
    console.log('🔧 Starting database migration...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check if latitude and longitude columns exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'daylight' 
      AND column_name IN ('latitude', 'longitude')
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('📋 Existing columns in daylight table:', existingColumns);
    
    // Add latitude column if it doesn't exist
    if (!existingColumns.includes('latitude')) {
      console.log('🔧 Adding latitude column...');
      await client.query(`
        ALTER TABLE daylight 
        ADD COLUMN latitude DECIMAL(10, 8) DEFAULT 28.6139
      `);
      console.log('✅ Added latitude column');
    } else {
      console.log('✅ Latitude column already exists');
    }
    
    // Add longitude column if it doesn't exist
    if (!existingColumns.includes('longitude')) {
      console.log('🔧 Adding longitude column...');
      await client.query(`
        ALTER TABLE daylight 
        ADD COLUMN longitude DECIMAL(11, 8) DEFAULT 77.2090
      `);
      console.log('✅ Added longitude column');
    } else {
      console.log('✅ Longitude column already exists');
    }
    
    // Update existing records with default coordinates if they're null
    console.log('🔧 Updating existing records with default coordinates...');
    const updateResult = await client.query(`
      UPDATE daylight 
      SET latitude = 28.6139, longitude = 77.2090 
      WHERE latitude IS NULL OR longitude IS NULL
    `);
    console.log(`✅ Updated ${updateResult.rowCount} records with default coordinates`);
    
    // Verify the changes
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'daylight' 
      AND column_name IN ('latitude', 'longitude')
      ORDER BY column_name
    `);
    
    console.log('📋 Updated daylight table structure:');
    verifyResult.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`);
    });
    
    console.log('✅ Database migration completed successfully!');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the migration
migrateDatabase();
