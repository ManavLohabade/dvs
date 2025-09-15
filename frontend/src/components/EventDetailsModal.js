import React from 'react';
import { X, Clock, Calendar, User, Tag, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const EventDetailsModal = ({ isOpen, onClose, event }) => {
  if (!isOpen || !event) return null;

  const getCategoryColor = (color) => {
    const colors = {
      blue: '#3b82f6',
      green: '#10b981',
      teal: '#14b8a6',
      amber: '#f59e0b',
      red: '#ef4444',
      yellow: '#eab308',
      orange: '#f97316',
      purple: '#8b5cf6',
      pink: '#ec4899'
    };
    return colors[color] || colors.blue;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-details-header">
          <div className="event-details-title">
            <Calendar className="event-details-icon" size={20} />
            <h3>Event Details</h3>
          </div>
          <button className="event-details-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="event-details-content">
          {/* Event Title */}
          <div className="event-details-section">
            <h4 className="event-details-event-title">
              {event.title || event.description || 'Untitled Event'}
            </h4>
          </div>

          {/* Event Description */}
          {event.description && (
            <div className="event-details-section">
              <div className="event-details-field">
                <span className="event-details-label">Description:</span>
                <span className="event-details-value">{event.description}</span>
              </div>
            </div>
          )}

          {/* Event Time */}
          <div className="event-details-section">
            <div className="event-details-field">
              <Clock className="event-details-field-icon" size={16} />
              <span className="event-details-label">Time:</span>
              <span className="event-details-value">
                {event.is_all_day ? 'All Day' :
                 event.start_time && event.end_time ? 
                  `${formatTime(event.start_time)} - ${formatTime(event.end_time)}` :
                  event.start_time || 'Not specified'
                }
              </span>
            </div>
          </div>

          {/* Event Date */}
          <div className="event-details-section">
            <div className="event-details-field">
              <Calendar className="event-details-field-icon" size={16} />
              <span className="event-details-label">Date:</span>
              <span className="event-details-value">
                {formatDate(event.start_date)}
              </span>
            </div>
          </div>

          {/* Event Category */}
          {event.category_name && (
            <div className="event-details-section">
              <div className="event-details-field">
                <Tag className="event-details-field-icon" size={16} />
                <span className="event-details-label">Category:</span>
                <div 
                  className="event-details-category"
                  style={{ 
                    backgroundColor: getCategoryColor(event.category_color),
                    color: 'white'
                  }}
                >
                  {event.category_name}
                </div>
              </div>
            </div>
          )}

          {/* Created By */}
          {event.created_by_name && (
            <div className="event-details-section">
              <div className="event-details-field">
                <User className="event-details-field-icon" size={16} />
                <span className="event-details-label">Created by:</span>
                <span className="event-details-value">{event.created_by_name}</span>
              </div>
            </div>
          )}

          {/* Event Color */}
          {event.color && (
            <div className="event-details-section">
              <div className="event-details-field">
                <div className="event-details-field-icon" style={{ 
                  width: '16px', 
                  height: '16px', 
                  borderRadius: '50%', 
                  backgroundColor: event.color 
                }}></div>
                <span className="event-details-label">Color:</span>
                <span className="event-details-value">{event.color}</span>
              </div>
            </div>
          )}
        </div>

        <div className="event-details-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;
