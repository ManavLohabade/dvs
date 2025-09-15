import React, { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Save, X, Calendar, User } from 'lucide-react';
import { goodTimingsAPI, categoriesAPI } from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminGoodTimings = () => {
  const [goodTimings, setGoodTimings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTiming, setEditingTiming] = useState(null);
  const [selectedTiming, setSelectedTiming] = useState(null);
  const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  
  const [formData, setFormData] = useState({
    day: '',
    start_date: '',
    end_date: ''
  });

  const [timeSlotFormData, setTimeSlotFormData] = useState({
    start_time: '',
    end_time: '',
    category_id: '',
    description: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper function to format date range
  const formatDateRange = (startDate, endDate) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // If same date, show just the date
      if (start.toDateString() === end.toDateString()) {
        return format(start, 'MMM d, yyyy');
      }
      
      // If different dates, show range
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return `${startDate} - ${endDate}`;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [timingsResponse, categoriesResponse] = await Promise.all([
        goodTimingsAPI.getAll(),
        categoriesAPI.getAll()
      ]);
      
      setGoodTimings(timingsResponse.data.good_timings);
      setCategories(categoriesResponse.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTimeSlotInputChange = (e) => {
    const { name, value } = e.target;
    setTimeSlotFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      day: '',
      start_date: '',
      end_date: ''
    });
    setEditingTiming(null);
    setShowForm(false);
  };

  const resetTimeSlotForm = () => {
    setTimeSlotFormData({
      start_time: '',
      end_time: '',
      category_id: '',
      description: ''
    });
    setEditingTimeSlot(null);
    setShowTimeSlotForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.day || !formData.start_date || !formData.end_date) {
      toast.error('All fields are required');
      return;
    }

    try {
      if (editingTiming) {
        await goodTimingsAPI.update(editingTiming.id, formData);
        toast.success('Good timing updated successfully');
      } else {
        await goodTimingsAPI.create(formData);
        toast.success('Good timing created successfully');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving good timing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save good timing';
      toast.error(errorMessage);
    }
  };

  const handleTimeSlotSubmit = async (e) => {
    e.preventDefault();
    
    if (!timeSlotFormData.start_time || !timeSlotFormData.end_time || !timeSlotFormData.category_id) {
      toast.error('Start time, end time, and category are required');
      return;
    }

    try {
      if (editingTimeSlot) {
        console.log('Updating time slot with ID:', editingTimeSlot.id);
        console.log('Time slot data:', timeSlotFormData);
        const submitData = {
          ...timeSlotFormData,
          category_id: parseInt(timeSlotFormData.category_id) || timeSlotFormData.category_id
        };
        await goodTimingsAPI.updateTimeSlot(editingTimeSlot.id, submitData);
        toast.success('Time slot updated successfully');
      } else {
        console.log('Adding time slot to timing:', selectedTiming.id);
        const submitData = {
          ...timeSlotFormData,
          category_id: parseInt(timeSlotFormData.category_id) || timeSlotFormData.category_id
        };
        await goodTimingsAPI.addTimeSlot(selectedTiming.id, submitData);
        toast.success('Time slot added successfully');
      }
      
      resetTimeSlotForm();
      fetchData();
    } catch (error) {
      console.error('Error saving time slot:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save time slot';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (timing) => {
    setEditingTiming(timing);
    setFormData({
      day: timing.day,
      start_date: timing.start_date,
      end_date: timing.end_date
    });
    setShowForm(true);
  };

  const handleDelete = async (timing) => {
    if (!window.confirm(`Are you sure you want to delete the good timing for ${timing.day}? This will also delete all associated time slots.`)) {
      return;
    }

    try {
      await goodTimingsAPI.delete(timing.id);
      toast.success('Good timing deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting good timing:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete good timing';
      toast.error(errorMessage);
    }
  };

  const handleEditTimeSlot = (timeSlot) => {
    console.log('Editing time slot:', timeSlot);
    setEditingTimeSlot(timeSlot);
    setTimeSlotFormData({
      start_time: timeSlot.start_time || '',
      end_time: timeSlot.end_time || '',
      category_id: timeSlot.category_id || '',
      description: timeSlot.description || ''
    });
    setShowTimeSlotForm(true);
  };

  const handleDeleteTimeSlot = async (timeSlot) => {
    if (!window.confirm(`Are you sure you want to delete this time slot?`)) {
      return;
    }

    try {
      await goodTimingsAPI.deleteTimeSlot(timeSlot.id);
      toast.success('Time slot deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete time slot';
      toast.error(errorMessage);
    }
  };



  const getColorClass = (colorToken) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      teal: 'bg-teal-100 text-teal-800',
      amber: 'bg-amber-100 text-amber-800',
      red: 'bg-red-100 text-red-800'
    };
    return colorMap[colorToken] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="good-timings-container">
        <div className="good-timings-bg-animation">
          <div className="good-timings-bg-circle"></div>
          <div className="good-timings-bg-circle"></div>
          <div className="good-timings-bg-circle"></div>
        </div>
        <div className="good-timings-content">
          <div className="good-timings-header">
            <h1 className="good-timings-title">Manage Good Timings</h1>
            <p className="good-timings-subtitle">Create and edit good timing slots for each day</p>
          </div>
          <div className="good-timings-card">
            <div className="good-timings-loading">
              <div className="good-timings-loading-spinner"></div>
              <div className="good-timings-loading-text">Loading good timings...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="good-timings-container">
      <div className="good-timings-bg-animation">
        <div className="good-timings-bg-circle"></div>
        <div className="good-timings-bg-circle"></div>
        <div className="good-timings-bg-circle"></div>
      </div>
      <div className="good-timings-content">
        <div className="good-timings-header">
          <div className="good-timings-header-content">
            <h1 className="good-timings-title">Manage Good Timings</h1>
            <p className="good-timings-subtitle">Create and edit good timing slots for each day</p>
          </div>
          <div className="good-timings-actions">
            <button 
              onClick={() => setShowForm(true)}
              className="good-timings-btn good-timings-btn-primary"
            >
              <Plus size={16} />
              Add Good Timing
            </button>
          </div>
        </div>

        {/* Add/Edit Good Timing Modal */}
        {showForm && (
          <div className="good-timings-modal-overlay" onClick={resetForm}>
            <div className="good-timings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="good-timings-modal-header">
                <h3 className="good-timings-modal-title">
                {editingTiming ? 'Edit Good Timing' : 'Add New Good Timing'}
              </h3>
              <button
                onClick={resetForm}
                  className="good-timings-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
          
              <div className="good-timings-modal-body">
            <form onSubmit={handleSubmit} className="good-timings-form">
              <div className="good-timings-form-grid">
                <div className="good-timings-form-group">
                  <label htmlFor="day" className="good-timings-form-label">
                    Day
                  </label>
                  <select
                    id="day"
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="good-timings-form-input"
                    required
                  >
                    <option value="">Select day</option>
                    {days.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="good-timings-form-group">
                  <label htmlFor="start_date" className="good-timings-form-label">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="good-timings-form-input"
                    required
                  />
                </div>
                
                <div className="good-timings-form-group">
                  <label htmlFor="end_date" className="good-timings-form-label">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="good-timings-form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="good-timings-form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="good-timings-btn good-timings-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="good-timings-btn good-timings-btn-primary"
                >
                  <Save size={16} />
                  {editingTiming ? 'Update' : 'Create'} Good Timing
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Time Slot Modal */}
        {showTimeSlotForm && (
          <div className="good-timings-modal-overlay" onClick={resetTimeSlotForm}>
            <div className="good-timings-modal" onClick={(e) => e.stopPropagation()}>
              <div className="good-timings-modal-header">
                <h3 className="good-timings-modal-title">
                {editingTimeSlot ? 'Edit Time Slot' : 'Add Time Slot'}
              </h3>
                {selectedTiming && !editingTimeSlot && (
                  <div className="good-timings-modal-subtitle">
                    For <strong>{selectedTiming.day}</strong> ({formatDateRange(selectedTiming.start_date, selectedTiming.end_date)})
                  </div>
                )}
              <button
                onClick={resetTimeSlotForm}
                  className="good-timings-modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>
          
              <div className="good-timings-modal-body">
            <form onSubmit={handleTimeSlotSubmit} className="good-timings-form">
              <div className="good-timings-form-grid">
                <div className="good-timings-form-group">
                  <label htmlFor="start_time" className="good-timings-form-label">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={timeSlotFormData.start_time}
                    onChange={handleTimeSlotInputChange}
                    className="good-timings-form-input"
                    required
                  />
                </div>
                
                <div className="good-timings-form-group">
                  <label htmlFor="end_time" className="good-timings-form-label">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={timeSlotFormData.end_time}
                    onChange={handleTimeSlotInputChange}
                    className="good-timings-form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="good-timings-form-group">
                <label htmlFor="category_id" className="good-timings-form-label">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={timeSlotFormData.category_id}
                  onChange={handleTimeSlotInputChange}
                  className="good-timings-form-input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="good-timings-form-group">
                <label htmlFor="description" className="good-timings-form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={timeSlotFormData.description}
                  onChange={handleTimeSlotInputChange}
                  className="good-timings-form-textarea"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div className="good-timings-form-actions">
                <button
                  type="button"
                  onClick={resetTimeSlotForm}
                  className="good-timings-btn good-timings-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="good-timings-btn good-timings-btn-primary"
                >
                  <Save size={16} />
                  {editingTimeSlot ? 'Update' : 'Add'} Time Slot
                </button>
              </div>
            </form>
              </div>
            </div>
          </div>
        )}

        {/* Good Timings List */}
        <div className="good-timings-list">
          {goodTimings.map((timing) => (
            <div key={timing.id} className="good-timings-card">
              <div className="good-timings-item-header">
                <div className="good-timings-item-info">
                  <div className="good-timings-item-title">
                    <Calendar size={20} className="good-timings-item-icon" />
                    <h3 className="good-timings-item-name">{timing.day}</h3>
                  </div>
                  <div className="good-timings-item-dates">
                    {formatDateRange(timing.start_date, timing.end_date)}
                  </div>
                  <div className="good-timings-item-author">
                    <User size={16} />
                    <span>{timing.created_by_name}</span>
                  </div>
                </div>
                
                <div className="good-timings-item-actions">
                  <button
                    onClick={() => {
                      setSelectedTiming(timing);
                      setShowTimeSlotForm(true);
                    }}
                    className="good-timings-btn good-timings-btn-primary good-timings-btn-sm"
                  >
                    <Plus size={14} />
                    Add Time Slot
                  </button>
                  <button
                    onClick={() => handleEdit(timing)}
                    className="good-timings-btn good-timings-btn-secondary good-timings-btn-sm"
                    title="Edit good timing"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(timing)}
                    className="good-timings-btn good-timings-btn-danger good-timings-btn-sm"
                    title="Delete good timing"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            
              {/* Time Slots */}
              {timing.time_slots && timing.time_slots.length > 0 ? (
                <div className="good-timings-time-slots">
                  {timing.time_slots.map((slot) => (
                    <div key={slot.id} className="good-timings-time-slot">
                      <div className="good-timings-time-slot-info">
                        <div className="good-timings-time-slot-time">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <span className={`good-timings-time-slot-category ${getColorClass(slot.category_color)}`}>
                          {slot.category_name}
                        </span>
                        {slot.description && (
                          <div className="good-timings-time-slot-description">
                            {slot.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="good-timings-time-slot-actions">
                        <button
                          onClick={() => handleEditTimeSlot(slot)}
                          className="good-timings-time-slot-action good-timings-time-slot-action-edit"
                          title="Edit time slot"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTimeSlot(slot)}
                          className="good-timings-time-slot-action good-timings-time-slot-action-delete"
                          title="Delete time slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="good-timings-empty-slots">
                  No time slots added yet. Click "Add Time Slot" to get started.
                </div>
              )}
            </div>
          ))}
          
          {goodTimings.length === 0 && (
            <div className="good-timings-card">
              <div className="good-timings-empty">
                <Clock size={64} className="good-timings-empty-icon" />
                <h3 className="good-timings-empty-title">No good timings found</h3>
                <p className="good-timings-empty-text">
                  Get started by creating your first good timing.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="good-timings-btn good-timings-btn-primary"
                >
          <Plus size={16} />
          Add Good Timing
        </button>
      </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminGoodTimings;
