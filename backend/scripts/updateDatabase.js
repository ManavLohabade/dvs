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

async function updateDatabase() {
  try {
    console.log('🔧 Connecting to database...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Check current tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Current tables:', tablesResult.rows.map(row => row.table_name).join(', '));
    
    // Read and execute the latest schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔧 Updating database schema...');
    await client.query(schemaSQL);
    
    console.log('✅ Database updated successfully!');
    
    // Check tables after update
    const updatedTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Updated tables:', updatedTablesResult.rows.map(row => row.table_name).join(', '));
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the update
updateDatabase();
