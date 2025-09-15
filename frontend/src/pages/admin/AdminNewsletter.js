import React, { useState, useEffect } from 'react';
import { Mail, Users, Send, Trash2, Plus, Eye, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { newsletterAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingNewsletter, setSendingNewsletter] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addingEmail, setAddingEmail] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recent: 0
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await newsletterAPI.getSubscribers();
      console.log('Newsletter API Response:', response.data);
      setSubscribers(response.data.subscribers || []);
      
      // Calculate stats
      const active = response.data.subscribers.filter(sub => sub.is_active).length;
      const recent = response.data.subscribers.filter(sub => {
        const subDate = new Date(sub.subscribed_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return subDate > weekAgo;
      }).length;
      
      setStats({
        total: response.data.subscribers.length,
        active,
        recent
      });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setAddingEmail(true);
      const response = await newsletterAPI.subscribe(newEmail);
      toast.success('Email added successfully!');
      setNewEmail('');
      fetchSubscribers();
    } catch (error) {
      console.error('Error adding email:', error);
      toast.error(error.response?.data?.message || 'Failed to add email');
    } finally {
      setAddingEmail(false);
    }
  };

  const handleRemoveEmail = async (email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the newsletter?`)) {
      return;
    }

    try {
      await newsletterAPI.unsubscribe(email);
      toast.success('Email removed successfully!');
      fetchSubscribers();
    } catch (error) {
      console.error('Error removing email:', error);
      toast.error('Failed to remove email');
    }
  };

  const handleSendNewsletter = async () => {
    if (!window.confirm(`Are you sure you want to send the daily newsletter to ${stats.active} subscribers?`)) {
      return;
    }

    try {
      setSendingNewsletter(true);
      const response = await newsletterAPI.sendDaily();
      toast.success(`Newsletter sent successfully! ${response.data.emailsSent} emails delivered.`);
    } catch (error) {
      console.error('Error sending newsletter:', error);
      toast.error('Failed to send newsletter');
    } finally {
      setSendingNewsletter(false);
    }
  };

  const handlePreviewNewsletter = async () => {
    try {
      const response = await newsletterAPI.preview();
      setPreviewData(response.data.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing newsletter:', error);
      toast.error('Failed to preview newsletter');
    }
  };

  const handleTestEmail = async () => {
    const testEmail = prompt('Enter email address for test:');
    if (!testEmail) return;

    try {
      await newsletterAPI.testEmail(testEmail);
      toast.success('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="newsletter-container">
        <div className="newsletter-bg-animation">
          <div className="newsletter-bg-circle"></div>
          <div className="newsletter-bg-circle"></div>
          <div className="newsletter-bg-circle"></div>
        </div>
        <div className="newsletter-content">
          <div className="newsletter-loading">
            <div className="newsletter-loading-spinner"></div>
            <div className="newsletter-loading-text">Loading newsletter data...</div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Rendering AdminNewsletter with subscribers:', subscribers);
  console.log('Stats:', stats);

  return (
    <div className="newsletter-container">
      <div className="newsletter-bg-animation">
        <div className="newsletter-bg-circle"></div>
        <div className="newsletter-bg-circle"></div>
        <div className="newsletter-bg-circle"></div>
      </div>
      <div className="newsletter-content">
        <div className="newsletter-header">
          <div className="newsletter-header-content">
            <h1 className="newsletter-title">Newsletter Management</h1>
            <p className="newsletter-subtitle">Manage subscribers and send daily newsletters</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="newsletter-stats">
          <div className="newsletter-stat-card">
            <div className="newsletter-stat-icon">
              <Users className="icon" size={24} />
            </div>
            <div className="newsletter-stat-content">
              <h3 className="newsletter-stat-number">{stats.total}</h3>
              <p className="newsletter-stat-label">Total Subscribers</p>
            </div>
          </div>
          
          <div className="newsletter-stat-card">
            <div className="newsletter-stat-icon active">
              <CheckCircle className="icon" size={24} />
            </div>
            <div className="newsletter-stat-content">
              <h3 className="newsletter-stat-number">{stats.active}</h3>
              <p className="newsletter-stat-label">Active Subscribers</p>
            </div>
          </div>
          
          <div className="newsletter-stat-card">
            <div className="newsletter-stat-icon recent">
              <RefreshCw className="icon" size={24} />
            </div>
            <div className="newsletter-stat-content">
              <h3 className="newsletter-stat-number">{stats.recent}</h3>
              <p className="newsletter-stat-label">New This Week</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="newsletter-actions">
          <button 
            onClick={handleSendNewsletter}
            disabled={sendingNewsletter || stats.active === 0}
            className="newsletter-btn newsletter-btn-primary"
          >
            {sendingNewsletter ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Send size={16} />
            )}
            Send Daily Newsletter ({stats.active} subscribers)
          </button>
          
          <button 
            onClick={handlePreviewNewsletter}
            className="newsletter-btn newsletter-btn-secondary"
          >
            <Eye size={16} />
            Preview Newsletter
          </button>
          
          <button 
            onClick={handleTestEmail}
            className="newsletter-btn newsletter-btn-secondary"
          >
            <Mail size={16} />
            Send Test Email
          </button>
          
          <button 
            onClick={fetchSubscribers}
            className="newsletter-btn newsletter-btn-secondary"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Add Email Form */}
        <div className="newsletter-card">
          <h2 className="newsletter-card-title">Add New Subscriber</h2>
          <form onSubmit={handleAddEmail} className="newsletter-form">
            <div className="newsletter-form-group">
              <label className="newsletter-form-label">Email Address</label>
              <div className="newsletter-form-input-group">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="newsletter-form-input"
                  required
                  disabled={addingEmail}
                />
                <button
                  type="submit"
                  disabled={addingEmail}
                  className="newsletter-btn newsletter-btn-primary"
                >
                  {addingEmail ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  Add
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Subscribers List */}
        <div className="newsletter-card">
          <div className="newsletter-card-header">
            <h2 className="newsletter-card-title">Subscribers ({subscribers.length})</h2>
          </div>
        
          {subscribers.length === 0 ? (
            <div className="newsletter-empty-state">
              <Mail className="icon" size={48} />
              <h3>No subscribers yet</h3>
              <p>Subscribers will appear here when they sign up for the newsletter.</p>
            </div>
          ) : (
            <div className="newsletter-table-container">
              <table className="newsletter-table">
                <thead>
                  <tr>
                    <th className="newsletter-table-th">Email</th>
                    <th className="newsletter-table-th">Status</th>
                    <th className="newsletter-table-th">Subscribed At</th>
                    <th className="newsletter-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length > 0 ? (
                    subscribers.map((subscriber) => {
                      console.log('Rendering subscriber:', subscriber);
                      return (
                        <tr key={subscriber.id} className="newsletter-table-row">
                          <td className="newsletter-table-td">
                            <div className="newsletter-table-email">
                              <Mail size={16} />
                              {subscriber.email}
                            </div>
                          </td>
                          <td className="newsletter-table-td">
                            <span className={`newsletter-status-badge ${subscriber.is_active ? 'active' : 'inactive'}`}>
                              {subscriber.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="newsletter-table-td newsletter-table-td-text">
                            {formatDate(subscriber.subscribed_at)}
                          </td>
                          <td className="newsletter-table-td">
                            <div className="newsletter-table-actions">
                              <button
                                onClick={() => handleRemoveEmail(subscriber.email)}
                                className="newsletter-btn newsletter-btn-danger"
                                title="Remove subscriber"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="newsletter-table-td text-center">
                        <div className="newsletter-empty-state">
                          <Mail className="icon" size={32} />
                          <p>No subscribers found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Newsletter Preview Modal */}
      {showPreview && previewData && (
        <div className="admin-modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Newsletter Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="admin-modal-close"
              >
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="newsletter-preview">
                <h4>Subject: {previewData.subject}</h4>
                <div className="newsletter-preview-content">
                  <div dangerouslySetInnerHTML={{ __html: previewData.emailContent }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
