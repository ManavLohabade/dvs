import React, { useState } from 'react';
import { Mail, Check, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubscribed(true);
        if (data.emailSent) {
          toast.success('Successfully subscribed! Check your email for confirmation.');
        } else {
          toast.success('Successfully subscribed! (Email service temporarily unavailable)');
        }
        setEmail('');
      } else {
        toast.error(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="newsletter-success">
        <div className="newsletter-success-icon">
          <Check size={24} />
        </div>
        <div className="newsletter-success-content">
          <h3 className="newsletter-success-title">You're All Set!</h3>
          <p className="newsletter-success-text">
            You'll receive your daily good timings and inspirational quotes every morning.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="newsletter-form">
      <div className="newsletter-input-group">
        <div className="newsletter-input-wrapper">
          <Mail className="newsletter-input-icon" size={20} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="newsletter-input"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="newsletter-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <div className="newsletter-loading-spinner"></div>
          ) : (
            <>
              <Send size={16} />
              Subscribe
            </>
          )}
        </button>
      </div>
      
      <div className="newsletter-benefits">
        <div className="newsletter-benefit">
          <div className="newsletter-benefit-dot"></div>
          <span>Daily good timings for today</span>
        </div>
        <div className="newsletter-benefit">
          <div className="newsletter-benefit-dot"></div>
          <span>Sunrise and sunset information</span>
        </div>
        <div className="newsletter-benefit">
          <div className="newsletter-benefit-dot"></div>
          <span>Inspirational quote of the day</span>
        </div>
      </div>
    </form>
  );
};

export default NewsletterForm;
