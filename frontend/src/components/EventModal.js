import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Tag, Palette, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { calendarAPI } from '../services/api';
import toast from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, selectedDate, event, onEventSaved, onEventDeleted }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    category_id: '',
    is_all_day: false,
    is_multi_day: false,
    color: 'blue'
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const colors = [
    { value: 'blue', label: 'Blue', color: '#3b82f6' },
    { value: 'green', label: 'Green', color: '#10b981' },
    { value: 'teal', label: 'Teal', color: '#14b8a6' },
    { value: 'amber', label: 'Amber', color: '#f59e0b' },
    { value: 'red', label: 'Red', color: '#ef4444' },
    { value: 'yellow', label: 'Yellow', color: '#eab308' },
    { value: 'orange', label: 'Orange', color: '#f97316' },
    { value: 'purple', label: 'Purple', color: '#8b5cf6' },
    { value: 'pink', label: 'Pink', color: '#ec4899' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (event) {
        setIsEditing(true);
        const isMultiDay = event.start_date !== event.end_date;
        setFormData({
          title: event.title || '',
          description: event.description || '',
          start_date: event.start_date || '',
          end_date: event.end_date || '',
          start_time: event.start_time || '',
          end_time: event.end_time || '',
          category_id: event.category_id || '',
          is_all_day: event.is_all_day || false,
          is_multi_day: isMultiDay,
          color: event.color || 'blue'
        });
      } else {
        setIsEditing(false);
        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        setFormData({
          title: '',
          description: '',
          start_date: dateStr,
          end_date: dateStr,
          start_time: '',
          end_time: '',
          category_id: '',
          is_all_day: false,
          is_multi_day: false,
          color: 'blue'
        });
      }
    }
  }, [isOpen, event, selectedDate]);

  const fetchCategories = async () => {
    try {
      const response = await calendarAPI.getCategories();
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Auto-sync end date with start date for single-day events
      if (name === 'start_date' && !prev.is_multi_day) {
        newData.end_date = value;
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const eventData = {
        ...formData,
        start_time: formData.is_all_day ? null : formData.start_time,
        end_time: formData.is_all_day ? null : formData.end_time,
        category_id: formData.category_id || null,
        // Ensure end_date is set to start_date for single-day events
        end_date: formData.is_multi_day ? formData.end_date : formData.start_date
      };

      if (isEditing) {
        await calendarAPI.update(event.id, eventData);
        toast.success('Event updated successfully');
        onEventSaved();
      } else {
        await calendarAPI.create(eventData);
        toast.success('Event created successfully');
        onEventSaved();
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !event) return;
    
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    setLoading(true);
    try {
      await calendarAPI.delete(event.id);
      toast.success('Event deleted successfully');
      onEventDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(error.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <div className="event-modal-title">
            <Calendar className="event-modal-icon" size={24} />
            <h2>{isEditing ? 'Edit Event' : 'Add New Event'}</h2>
          </div>
          <button className="event-modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-modal-form">
          <div className="event-modal-content">
            {/* Title */}
            <div className="event-form-group">
              <label className="event-form-label">
                <Calendar size={16} />
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="event-form-input"
                placeholder="Enter event title"
                required
              />
            </div>

            {/* Description */}
            <div className="event-form-group">
              <label className="event-form-label">
                <Clock size={16} />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="event-form-textarea"
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            {/* Date */}
            <div className="event-form-group">
              <label className="event-form-label">
                <Calendar size={16} />
                Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="event-form-input"
                required
              />
            </div>

            {/* Multi-day Toggle */}
            <div className="event-form-group">
              <label className="event-form-checkbox">
                <input
                  type="checkbox"
                  name="is_multi_day"
                  checked={formData.is_multi_day}
                  onChange={handleInputChange}
                />
                <span className="event-checkbox-text">Multi-day Event</span>
              </label>
            </div>

            {/* End Date - Only show for multi-day events */}
            {formData.is_multi_day && (
              <div className="event-form-group">
                <label className="event-form-label">
                  <Calendar size={16} />
                  End Date *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  className="event-form-input"
                  required
                />
              </div>
            )}

            {/* All Day Toggle */}
            <div className="event-form-group">
              <label className="event-form-checkbox">
                <input
                  type="checkbox"
                  name="is_all_day"
                  checked={formData.is_all_day}
                  onChange={handleInputChange}
                />
                <span className="event-checkbox-text">All Day Event</span>
              </label>
            </div>

            {/* Time Fields */}
            {!formData.is_all_day && (
              <div className="event-form-row">
                <div className="event-form-group">
                  <label className="event-form-label">Start Time</label>
                  <input
                    type="time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="event-form-input"
                  />
                </div>
                <div className="event-form-group">
                  <label className="event-form-label">End Time</label>
                  <input
                    type="time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="event-form-input"
                  />
                </div>
              </div>
            )}

            {/* Category */}
            <div className="event-form-group">
              <label className="event-form-label">
                <Tag size={16} />
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="event-form-select"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Color */}
            <div className="event-form-group">
              <label className="event-form-label">
                <Palette size={16} />
                Color
              </label>
              <div className="event-color-picker">
                {colors.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    className={`event-color-option ${
                      formData.color === color.value ? 'selected' : ''
                    }`}
                    style={{ backgroundColor: color.color }}
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="event-modal-footer">
            <div className="event-modal-actions">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="event-btn event-btn-danger"
                  disabled={loading}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
              <div className="event-modal-actions-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="event-btn event-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="event-btn event-btn-primary"
                  disabled={loading}
                >
                  <Save size={16} />
                  {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
