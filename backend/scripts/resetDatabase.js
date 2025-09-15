const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'adainsys.ddns.net',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dvs',
  user: process.env.DB_USER || 'dvs',
  password: process.env.DB_PASSWORD || 'dvs',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(dbConfig);

async function resetDatabase() {
  try {
    console.log('🔧 Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Drop all tables in correct order (respecting foreign key constraints)
    console.log('🗑️  Dropping existing tables...');
    
    const dropQueries = [
      'DROP TABLE IF EXISTS newsletter_subscribers CASCADE;',
      'DROP TABLE IF EXISTS time_slot_child CASCADE;',
      'DROP TABLE IF EXISTS good_timings CASCADE;',
      'DROP TABLE IF EXISTS daylight CASCADE;',
      'DROP TABLE IF EXISTS categories CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;'
    ];
    
    for (const query of dropQueries) {
      try {
        await client.query(query);
        console.log(`✅ Executed: ${query}`);
      } catch (error) {
        console.log(`⚠️  Warning: ${query} - ${error.message}`);
      }
    }
    
    // Read and execute the latest schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Creating fresh database schema...');
    await client.query(schemaSQL);
    
    console.log('✅ Database reset successfully!');
    console.log('📋 Fresh database created with sample data');
    console.log('📋 Default accounts available:');
    console.log('   Admin: admin@dvs.com / admin123');
    console.log('   User:  user@dvs.com / user123');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
