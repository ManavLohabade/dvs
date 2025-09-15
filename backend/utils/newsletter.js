const { query } = require('../config/database');
const { format } = require('date-fns');

// Sample inspirational quotes
const quotes = [
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Don't be afraid to give up the good to go for the great. - John D. Rockefeller",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "If you really look closely, most overnight successes took a long time. - Steve Jobs",
  "Life is what happens to you while you're busy making other plans. - John Lennon",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Your time is limited, don't waste it living someone else's life. - Steve Jobs"
];

// Get a random quote
function getRandomQuote() {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Get today's good timings
async function getTodaysGoodTimings() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayDay = format(new Date(), 'EEEE');
    
    const result = await query(`
      SELECT 
        gt.day,
        gt.start_date,
        gt.end_date,
        tsc.start_time,
        tsc.end_time,
        c.name as category_name,
        c.color_token as category_color,
        tsc.description
      FROM good_timings gt
      LEFT JOIN time_slot_child tsc ON gt.id = tsc.time_slot_id
      LEFT JOIN categories c ON tsc.category_id = c.id
      WHERE gt.day = $1 
        AND gt.start_date <= $2 
        AND gt.end_date >= $2
        AND c.is_active = true
      ORDER BY tsc.start_time
    `, [todayDay, today]);

    return result.rows;
  } catch (error) {
    console.error('Error fetching today\'s good timings:', error);
    return [];
  }
}

// Get today's daylight information
async function getTodaysDaylight() {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const result = await query(`
      SELECT sunrise_time, sunset_time, timezone
      FROM daylight 
      WHERE date = $1
    `, [today]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching today\'s daylight:', error);
    return null;
  }
}

// Generate email content
function generateEmailContent(timings, daylight, quote) {
  const today = format(new Date(), 'EEEE, MMMM do, yyyy');
  
  let content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Daily Good Timings - ${today}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 28px; }
        .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
        .section h2 { color: #3b82f6; margin-top: 0; }
        .timing-item { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .time-range { font-weight: bold; color: #3b82f6; }
        .category { background: #e3f2fd; color: #1976d2; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .daylight-info { display: flex; justify-content: space-around; text-align: center; }
        .daylight-item { background: white; padding: 15px; border-radius: 6px; flex: 1; margin: 0 5px; }
        .quote { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; font-style: italic; text-align: center; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🌟 Your Daily Good Timings</h1>
        <p>${today}</p>
      </div>
  `;

  // Good Timings Section
  if (timings.length > 0) {
    content += `
      <div class="section">
        <h2>⏰ Today's Good Timings</h2>
    `;
    
    timings.forEach(timing => {
      content += `
        <div class="timing-item">
          <div class="time-range">${timing.start_time} - ${timing.end_time}</div>
          <div class="category">${timing.category_name}</div>
          ${timing.description ? `<p style="margin: 8px 0 0 0; color: #666;">${timing.description}</p>` : ''}
        </div>
      `;
    });
    
    content += `</div>`;
  } else {
    content += `
      <div class="section">
        <h2>⏰ Today's Good Timings</h2>
        <p>No timings scheduled for today. Enjoy your free time!</p>
      </div>
    `;
  }

  // Daylight Section
  if (daylight) {
    content += `
      <div class="section">
        <h2>☀️ Daylight Information</h2>
        <div class="daylight-info">
          <div class="daylight-item">
            <h3 style="color: #f59e0b; margin: 0;">🌅 Sunrise</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${daylight.sunrise_time}</p>
          </div>
          <div class="daylight-item">
            <h3 style="color: #f97316; margin: 0;">🌇 Sunset</h3>
            <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${daylight.sunset_time}</p>
          </div>
        </div>
        ${daylight.timezone ? `<p style="text-align: center; color: #666; margin: 10px 0 0 0;">Timezone: ${daylight.timezone}</p>` : ''}
      </div>
    `;
  }

  // Quote Section
  content += `
    <div class="quote">
      <h3 style="margin: 0 0 10px 0; color: #856404;">💭 Quote of the Day</h3>
      <p style="margin: 0; font-size: 16px;">"${quote}"</p>
    </div>
  `;

  // Footer
  content += `
      <div class="footer">
        <p>Thank you for subscribing to DVS Daily Newsletter!</p>
        <p>To unsubscribe, click <a href="#">here</a></p>
      </div>
    </body>
    </html>
  `;

  return content;
}

// Get all active subscribers
async function getActiveSubscribers() {
  try {
    const result = await query(`
      SELECT email FROM newsletter_subscribers 
      WHERE is_active = true
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching active subscribers:', error);
    return [];
  }
}

// Generate daily newsletter data
async function generateDailyNewsletter() {
  try {
    const [timings, daylight] = await Promise.all([
      getTodaysGoodTimings(),
      getTodaysDaylight()
    ]);
    
    const quote = getRandomQuote();
    const emailContent = generateEmailContent(timings, daylight, quote);
    
    return {
      timings,
      daylight,
      quote,
      emailContent,
      subject: `Your Daily Good Timings - ${format(new Date(), 'EEEE, MMMM do')}`
    };
  } catch (error) {
    console.error('Error generating daily newsletter:', error);
    throw error;
  }
}

module.exports = {
  getRandomQuote,
  getTodaysGoodTimings,
  getTodaysDaylight,
  generateEmailContent,
  getActiveSubscribers,
  generateDailyNewsletter
};
