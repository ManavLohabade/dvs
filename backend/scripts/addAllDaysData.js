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

async function addAllDaysData() {
  try {
    console.log('🔧 Adding sample data for all days of the week...');
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    
    // Get today's date for reference
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      console.log(`🔧 Adding data for ${day}...`);
      
      // Check if good timing already exists for this day
      const existingTiming = await client.query(
        'SELECT id FROM good_timings WHERE day = $1',
        [day]
      );
      
      if (existingTiming.rows.length > 0) {
        console.log(`✅ Good timing already exists for ${day}`);
        continue;
      }
      
      // Create good timing for this day
      const timingResult = await client.query(`
        INSERT INTO good_timings (day, created_by, start_date, end_date)
        VALUES ($1, 1, $2, $2)
        RETURNING id
      `, [day, todayStr]);
      
      const timingId = timingResult.rows[0].id;
      console.log(`✅ Created good timing for ${day} with ID: ${timingId}`);
      
      // Add 2-3 time slots for each day
      const timeSlots = [
        {
          start_time: '09:00:00',
          end_time: '10:00:00',
          category_id: 1, // Work
          description: `${day.charAt(0).toUpperCase() + day.slice(1)} morning work session`
        },
        {
          start_time: '14:00:00',
          end_time: '15:00:00',
          category_id: 2, // Personal
          description: `${day.charAt(0).toUpperCase() + day.slice(1)} personal time`
        },
        {
          start_time: '16:00:00',
          end_time: '17:00:00',
          category_id: 3, // Health
          description: `${day.charAt(0).toUpperCase() + day.slice(1)} health & wellness`
        }
      ];
      
      for (const slot of timeSlots) {
        await client.query(`
          INSERT INTO time_slot_child (time_slot_id, start_time, end_time, category_id, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [timingId, slot.start_time, slot.end_time, slot.category_id, slot.description]);
      }
      
      console.log(`✅ Added ${timeSlots.length} time slots for ${day}`);
    }
    
    console.log('✅ All days data added successfully!');
    console.log('📋 Now the dashboard will show good timings for any day of the week');
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error adding all days data:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run the script
addAllDaysData();
