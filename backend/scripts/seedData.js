const { query } = require('../config/database');

async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Get today's date and day
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log('Today:', todayStr, 'Day:', todayDay);
    
    // Check if we already have data for today
    const existingTiming = await query(
      'SELECT id FROM good_timings WHERE day = $1 AND start_date = $2',
      [todayDay, todayStr]
    );
    
    if (existingTiming.rows.length === 0) {
      // Insert good timing for today
      const timingResult = await query(`
        INSERT INTO good_timings (day, created_by, start_date, end_date)
        VALUES ($1, 1, $2, $2)
        RETURNING id
      `, [todayDay, todayStr]);
      
      const timingId = timingResult.rows[0].id;
      console.log('Created good timing with ID:', timingId);
      
      // Insert time slots for today
      const timeSlots = [
        { start: '09:00:00', end: '10:00:00', category: 1, desc: 'Morning standup meeting' },
        { start: '14:00:00', end: '15:00:00', category: 1, desc: 'Project planning session' },
        { start: '16:00:00', end: '17:00:00', category: 2, desc: 'Personal time' }
      ];
      
      for (const slot of timeSlots) {
        await query(`
          INSERT INTO time_slot_child (time_slot_id, start_time, end_time, category_id, description)
          VALUES ($1, $2, $3, $4, $5)
        `, [timingId, slot.start, slot.end, slot.category, slot.desc]);
      }
      
      console.log('Created time slots for today');
    } else {
      console.log('Good timing already exists for today');
    }
    
    // Check if we have daylight data for today
    const existingDaylight = await query(
      'SELECT id FROM daylight WHERE date = $1',
      [todayStr]
    );
    
    if (existingDaylight.rows.length === 0) {
      // Insert sample daylight data for today
      await query(`
        INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, latitude, longitude, day_length)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        todayStr,
        '06:30:00',
        '18:30:00',
        'Asia/Kolkata',
        28.6139,
        77.2090,
        '12:00:00'
      ]);
      
      console.log('Created daylight data for today');
    } else {
      console.log('Daylight data already exists for today');
    }
    
    console.log('✅ Sample data seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedSampleData().then(() => {
    console.log('Script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { seedSampleData };
