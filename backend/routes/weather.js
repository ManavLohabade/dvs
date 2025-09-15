const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Fetch real-time sunrise/sunset data from external API
const fetchSunriseSunsetData = async (date, lat = 28.6139, lng = 77.2090) => {
  try {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    const url = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Weather API returned error: ${data.status}`);
    }
    
    return {
      success: true,
      data: {
        sunrise: data.results.sunrise,
        sunset: data.results.sunset,
        solar_noon: data.results.solar_noon,
        civil_twilight_begin: data.results.civil_twilight_begin,
        civil_twilight_end: data.results.civil_twilight_end,
        nautical_twilight_begin: data.results.nautical_twilight_begin,
        nautical_twilight_end: data.results.nautical_twilight_end,
        astronomical_twilight_begin: data.results.astronomical_twilight_begin,
        astronomical_twilight_end: data.results.astronomical_twilight_end,
        date: dateStr,
        latitude: lat,
        longitude: lng
      }
    };
  } catch (error) {
    console.error('Error fetching sunrise/sunset data:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Get real-time daylight data for a specific date
router.get('/daylight/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { lat, lng } = req.query;
    
    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please provide a valid date in YYYY-MM-DD format'
      });
    }
    
    // Check if we have cached data in database
    const existingData = await query(
      'SELECT * FROM daylight WHERE date = $1',
      [date]
    );
    
    if (existingData.rows.length > 0) {
      const cachedData = existingData.rows[0];
      const cacheTime = new Date(cachedData.updated_at);
      const now = new Date();
      const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
      
      // If data is less than 6 hours old, return cached data
      if (hoursDiff < 6) {
        return res.json({
          message: 'Daylight data retrieved from cache',
          data: {
            date: cachedData.date,
            sunrise_time: cachedData.sunrise_time,
            sunset_time: cachedData.sunset_time,
            timezone: cachedData.timezone,
            latitude: cachedData.latitude,
            longitude: cachedData.longitude,
            cached: true
          }
        });
      }
    }
    
    // Fetch fresh data from API
    const latitude = lat ? parseFloat(lat) : 28.6139;
    const longitude = lng ? parseFloat(lng) : 77.2090;
    
    const apiResult = await fetchSunriseSunsetData(date, latitude, longitude);
    
    if (!apiResult.success) {
      return res.status(500).json({
        error: 'Failed to fetch daylight data',
        message: apiResult.error
      });
    }
    
    const { data } = apiResult;
    
    // Convert UTC times to local timezone (assuming IST for now)
    const sunriseTime = new Date(data.sunrise).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false
    });
    
    const sunsetTime = new Date(data.sunset).toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false
    });
    
    // Store or update in database
    await query(`
      INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, latitude, longitude, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (date) 
      DO UPDATE SET 
        sunrise_time = EXCLUDED.sunrise_time,
        sunset_time = EXCLUDED.sunset_time,
        timezone = EXCLUDED.timezone,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        updated_at = NOW()
    `, [
      date,
      sunriseTime,
      sunsetTime,
      'Asia/Kolkata',
      latitude,
      longitude
    ]);
    
    res.json({
      message: 'Daylight data fetched and updated successfully',
      data: {
        date: date,
        sunrise_time: sunriseTime,
        sunset_time: sunsetTime,
        timezone: 'Asia/Kolkata',
        latitude: latitude,
        longitude: longitude,
        cached: false
      }
    });
    
  } catch (error) {
    console.error('Get daylight data error:', error);
    res.status(500).json({
      error: 'Failed to get daylight data',
      message: 'Unable to fetch daylight information'
    });
  }
});

// Update daylight data manually (admin only)
router.put('/daylight/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { sunrise_time, sunset_time, timezone, latitude, longitude } = req.body;
    
    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please provide a valid date in YYYY-MM-DD format'
      });
    }
    
    // Update daylight data
    const result = await query(`
      UPDATE daylight 
      SET sunrise_time = $2, sunset_time = $3, timezone = $4, latitude = $5, longitude = $6, updated_at = NOW()
      WHERE date = $1
      RETURNING *
    `, [date, sunrise_time, sunset_time, timezone, latitude, longitude]);
    
    if (result.rows.length === 0) {
      // Create new entry if it doesn't exist
      const insertResult = await query(`
        INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, latitude, longitude, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [date, sunrise_time, sunset_time, timezone, latitude, longitude]);
      
      return res.json({
        message: 'Daylight data created successfully',
        data: insertResult.rows[0]
      });
    }
    
    res.json({
      message: 'Daylight data updated successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update daylight data error:', error);
    res.status(500).json({
      error: 'Failed to update daylight data',
      message: 'Unable to update daylight information'
    });
  }
});

// Get weather data for multiple dates
router.get('/daylight/range', async (req, res) => {
  try {
    const { start_date, end_date, lat, lng } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Please provide start_date and end_date'
      });
    }
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please provide valid dates in YYYY-MM-DD format'
      });
    }
    
    // Get existing data from database
    const existingData = await query(
      'SELECT * FROM daylight WHERE date >= $1 AND date <= $2 ORDER BY date',
      [start_date, end_date]
    );
    
    const results = [];
    const existingDates = new Set(existingData.rows.map(row => row.date));
    
    // Fetch missing data from API
    const latitude = lat ? parseFloat(lat) : 28.6139;
    const longitude = lng ? parseFloat(lng) : 77.2090;
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      if (existingDates.has(dateStr)) {
        // Use existing data
        const existing = existingData.rows.find(row => row.date === dateStr);
        results.push(existing);
      } else {
        // Fetch from API
        const apiResult = await fetchSunriseSunsetData(d, latitude, longitude);
        
        if (apiResult.success) {
          const { data } = apiResult;
          
          const sunriseTime = new Date(data.sunrise).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false
          });
          
          const sunsetTime = new Date(data.sunset).toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour12: false
          });
          
           // Store in database
           await query(`
             INSERT INTO daylight (date, sunrise_time, sunset_time, timezone, latitude, longitude, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
           `, [
             dateStr,
             sunriseTime,
             sunsetTime,
             'Asia/Kolkata',
             latitude,
             longitude
           ]);
          
           results.push({
             date: dateStr,
             sunrise_time: sunriseTime,
             sunset_time: sunsetTime,
             timezone: 'Asia/Kolkata',
             latitude: latitude,
             longitude: longitude
           });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    res.json({
      message: 'Daylight data retrieved successfully',
      data: results
    });
    
  } catch (error) {
    console.error('Get daylight range error:', error);
    res.status(500).json({
      error: 'Failed to get daylight data range',
      message: 'Unable to fetch daylight information'
    });
  }
});

module.exports = router;
