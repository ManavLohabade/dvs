const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Send welcome email to new subscriber
const sendWelcomeEmail = async (email) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"DVS Daily Newsletter" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to DVS Daily Newsletter! 🌟',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to DVS Daily Newsletter</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6; }
            .benefits { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .benefit-item { display: flex; align-items: center; margin: 15px 0; }
            .benefit-icon { background: #3b82f6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 16px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            .cta-button { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌟 Welcome to DVS Daily Newsletter!</h1>
            <p>You're all set to receive your personalized daily updates</p>
          </div>
          
          <div class="content">
            <h2>Thank you for subscribing!</h2>
            <p>We're excited to have you join our community. Starting tomorrow, you'll receive your daily newsletter with:</p>
          </div>
          
          <div class="benefits">
            <div class="benefit-item">
              <div class="benefit-icon">⏰</div>
              <div>
                <strong>Daily Good Timings</strong><br>
                <span style="color: #666;">Your personalized schedule for the day</span>
              </div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">☀️</div>
              <div>
                <strong>Sunrise & Sunset Times</strong><br>
                <span style="color: #666;">Stay in sync with natural daylight cycles</span>
              </div>
            </div>
            <div class="benefit-item">
              <div class="benefit-icon">💭</div>
              <div>
                <strong>Daily Inspiration</strong><br>
                <span style="color: #666;">Motivational quotes to start your day right</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta-button">Visit Your Dashboard</a>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>To unsubscribe, <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(email)}">click here</a></p>
            <p>© 2024 DVS - Daily Good Timings System</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send daily newsletter to all subscribers
const sendDailyNewsletter = async (subscribers, newsletterData) => {
  try {
    const transporter = createTransporter();
    const results = [];
    
    for (const subscriber of subscribers) {
      try {
        const mailOptions = {
          from: `"DVS Daily Newsletter" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
          to: subscriber.email,
          subject: newsletterData.subject,
          html: newsletterData.emailContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Daily newsletter sent to ${subscriber.email}:`, info.messageId);
        results.push({ email: subscriber.email, success: true, messageId: info.messageId });
        
        // Add a small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending newsletter to ${subscriber.email}:`, error);
        results.push({ email: subscriber.email, success: false, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in sendDailyNewsletter:', error);
    throw error;
  }
};

// Send test email (for testing purposes)
const sendTestEmail = async (toEmail) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"DVS Test" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'DVS Email Test - Newsletter System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>DVS Email Test</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 10px; text-align: center; }
            .content { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✅ Email Test Successful!</h1>
            <p>DVS Newsletter System is working perfectly</p>
          </div>
          <div class="content">
            <h2>Test Details:</h2>
            <ul>
              <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              <li><strong>Recipient:</strong> ${toEmail}</li>
              <li><strong>Status:</strong> Email service is operational</li>
            </ul>
            <p>If you received this email, the newsletter system is ready to send daily updates!</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending test email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createTransporter,
  sendWelcomeEmail,
  sendDailyNewsletter,
  sendTestEmail
};
