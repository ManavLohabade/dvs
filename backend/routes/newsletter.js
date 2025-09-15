const express = require('express');
const { query } = require('../config/database');
const { generateDailyNewsletter, getActiveSubscribers } = require('../utils/newsletter');
const { sendWelcomeEmail, sendDailyNewsletter, sendTestEmail } = require('../utils/emailService');
const router = express.Router();

// Subscribe to newsletter
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide a valid email address'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please provide a valid email address'
      });
    }

    // Check if email already exists
    const existingSubscriber = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existingSubscriber.rows.length > 0) {
      return res.status(409).json({
        error: 'Email already subscribed',
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Add subscriber to database
    const result = await query(
      'INSERT INTO newsletter_subscribers (email, subscribed_at, is_active) VALUES ($1, NOW(), true) RETURNING id, email, subscribed_at',
      [email]
    );

    // Send welcome email
    const emailResult = await sendWelcomeEmail(email);
    
    if (emailResult.success) {
      console.log(`Welcome email sent successfully to ${email}`);
    } else {
      console.error(`Failed to send welcome email to ${email}:`, emailResult.error);
      // Don't fail the subscription if email fails, just log it
    }

    res.status(201).json({
      message: 'Successfully subscribed to newsletter',
      subscriber: result.rows[0],
      emailSent: emailResult.success
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      error: 'Failed to subscribe to newsletter',
      message: 'Unable to process subscription request'
    });
  }
});

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide a valid email address'
      });
    }

    // Check if email exists
    const existingSubscriber = await query(
      'SELECT id FROM newsletter_subscribers WHERE email = $1',
      [email]
    );

    if (existingSubscriber.rows.length === 0) {
      return res.status(404).json({
        error: 'Email not found',
        message: 'This email is not subscribed to our newsletter'
      });
    }

    // Deactivate subscription
    await query(
      'UPDATE newsletter_subscribers SET is_active = false, unsubscribed_at = NOW() WHERE email = $1',
      [email]
    );

    res.json({
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscription error:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from newsletter',
      message: 'Unable to process unsubscription request'
    });
  }
});

// Get all active subscribers (admin only)
router.get('/subscribers', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, subscribed_at, is_active FROM newsletter_subscribers WHERE is_active = true ORDER BY subscribed_at DESC'
    );

    res.json({
      message: 'Active subscribers retrieved successfully',
      subscribers: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({
      error: 'Failed to retrieve subscribers',
      message: 'Unable to fetch subscriber list'
    });
  }
});

// Send daily newsletter (admin only)
router.post('/send-daily', async (req, res) => {
  try {
    // Generate newsletter content
    const newsletterData = await generateDailyNewsletter();
    const subscribers = await getActiveSubscribers();
    
    if (subscribers.length === 0) {
      return res.json({
        message: 'No active subscribers found',
        data: {
          subscriberCount: 0,
          emailsSent: 0
        }
      });
    }
    
    // Send emails to all subscribers
    const emailResults = await sendDailyNewsletter(subscribers, newsletterData);
    
    const successfulEmails = emailResults.filter(result => result.success).length;
    const failedEmails = emailResults.filter(result => !result.success).length;
    
    res.json({
      message: 'Daily newsletter sending completed',
      data: {
        subject: newsletterData.subject,
        subscriberCount: subscribers.length,
        emailsSent: successfulEmails,
        emailsFailed: failedEmails,
        hasTimings: newsletterData.timings.length > 0,
        hasDaylight: !!newsletterData.daylight,
        quote: newsletterData.quote,
        results: emailResults
      }
    });

  } catch (error) {
    console.error('Send daily newsletter error:', error);
    res.status(500).json({
      error: 'Failed to send daily newsletter',
      message: 'Unable to process newsletter sending'
    });
  }
});

// Preview daily newsletter (admin only)
router.get('/preview', async (req, res) => {
  try {
    const newsletterData = await generateDailyNewsletter();
    
    res.json({
      message: 'Newsletter preview generated successfully',
      data: newsletterData
    });

  } catch (error) {
    console.error('Preview newsletter error:', error);
    res.status(500).json({
      error: 'Failed to generate newsletter preview',
      message: 'Unable to generate preview'
    });
  }
});

// Test email sending (admin only)
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide an email address for testing'
      });
    }
    
    const result = await sendTestEmail(email);
    
    if (result.success) {
      res.json({
        message: 'Test email sent successfully',
        data: {
          email: email,
          messageId: result.messageId
        }
      });
    } else {
      res.status(500).json({
        error: 'Failed to send test email',
        message: result.error
      });
    }

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      error: 'Failed to send test email',
      message: 'Unable to process test email request'
    });
  }
});

module.exports = router;
