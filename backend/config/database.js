const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'dvs_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 10, 
  min: 2, 
  idleTimeoutMillis: 60000, 
  connectionTimeoutMillis: 20000, 
  acquireTimeoutMillis: 60000, 
  keepAlive: true, 
  keepAliveInitialDelayMillis: 10000, 
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  // Don't exit the process immediately, try to reconnect
  console.log('🔄 Attempting to reconnect to database...');
});

// Add connection retry logic
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

const reconnectToDatabase = async () => {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('❌ Max reconnection attempts reached. Exiting...');
    process.exit(1);
  }
  
  reconnectAttempts++;
  console.log(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts}`);
  
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database reconnection successful');
    reconnectAttempts = 0; // Reset counter on successful connection
  } catch (error) {
    console.error('❌ Reconnection failed:', error.message);
    setTimeout(reconnectToDatabase, 5000); // Retry after 5 seconds
  }
};

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  let retries = 3;
  
  while (retries > 0) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('📊 Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('❌ Query error:', error.message);
      
      // If it's a connection error, try to reconnect
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        retries--;
        if (retries > 0) {
          console.log(`🔄 Retrying query (${retries} attempts left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          continue;
        }
      }
      
      throw error;
    }
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

// Helper function to execute transactions
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  getClient,
  transaction
};
