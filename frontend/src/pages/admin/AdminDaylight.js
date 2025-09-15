import React, { useState, useEffect } from 'react';
import { Sun, Plus, Edit2, Trash2, Save, X, Calendar } from 'lucide-react';
import { daylightAPI, weatherAPI } from '../../services/api';
import toast from 'react-hot-toast';

const AdminDaylight = () => {
  const [daylightData, setDaylightData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDaylight, setEditingDaylight] = useState(null);
  
  const [formData, setFormData] = useState({
    date: '',
    sunrise_time: '',
    sunset_time: '',
    timezone: 'Asia/Kolkata',
    notes: ''
  });


  const timezones = [
    { value: 'Asia/Kolkata', label: 'IST' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'EST' },
    { value: 'America/Los_Angeles', label: 'PST' },
    { value: 'America/Chicago', label: 'CST' },
    { value: 'America/Denver', label: 'MST' },
    { value: 'Europe/London', label: 'GMT' },
    { value: 'Europe/Paris', label: 'CET' },
    { value: 'Asia/Tokyo', label: 'JST' },
    { value: 'Australia/Sydney', label: 'AEST' }
  ];

  useEffect(() => {
    fetchDaylightData();
  }, []);

  const fetchDaylightData = async () => {
    try {
      setLoading(true);
      const response = await daylightAPI.getAll();
      setDaylightData(response.data.daylight);
    } catch (error) {
      console.error('Error fetching daylight data:', error);
      toast.error('Failed to load daylight data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeData = async (date) => {
    try {
      const response = await weatherAPI.getDaylight(date);
      if (response.data.success) {
        const realTimeData = response.data.data;
        setFormData({
          date: realTimeData.date,
          sunrise_time: realTimeData.sunrise_time,
          sunset_time: realTimeData.sunset_time,
          timezone: realTimeData.timezone || 'Asia/Kolkata',
          notes: `Real-time data fetched on ${new Date().toLocaleString()}`
        });
        toast.success('Real-time data fetched successfully');
      } else {
        toast.error('Failed to fetch real-time data');
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
      toast.error('Failed to fetch real-time data');
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      date: '',
      sunrise_time: '',
      sunset_time: '',
      timezone: 'Asia/Kolkata',
      notes: ''
    });
    setEditingDaylight(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.date || !formData.sunrise_time || !formData.sunset_time) {
      toast.error('Date, sunrise time, and sunset time are required');
      return;
    }

    if (formData.sunrise_time >= formData.sunset_time) {
      toast.error('Sunrise time must be before sunset time');
      return;
    }

    try {
      await daylightAPI.createOrUpdate(formData.date, formData);
      toast.success('Daylight data saved successfully');
      resetForm();
      fetchDaylightData();
    } catch (error) {
      console.error('Error saving daylight data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save daylight data';
      toast.error(errorMessage);
    }
  };

  const handleEdit = (daylight) => {
    setEditingDaylight(daylight);
    setFormData({
      date: daylight.date,
      sunrise_time: daylight.sunrise_time,
      sunset_time: daylight.sunset_time,
      timezone: daylight.timezone || 'Asia/Kolkata',
      notes: daylight.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (daylight) => {
    if (!window.confirm(`Are you sure you want to delete daylight data for ${daylight.date}?`)) {
      return;
    }

    try {
      await daylightAPI.delete(daylight.date);
      toast.success('Daylight data deleted successfully');
      fetchDaylightData();
    } catch (error) {
      console.error('Error deleting daylight data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete daylight data';
      toast.error(errorMessage);
    }
  };



  const clearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL daylight data? This action cannot be undone.')) {
      return;
    }

    try {
      await daylightAPI.deleteAll();
      toast.success('All daylight data has been cleared successfully');
      fetchDaylightData();
    } catch (error) {
      console.error('Error clearing daylight data:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear daylight data';
      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="daylight-container">
        <div className="daylight-bg-animation">
          <div className="daylight-bg-circle"></div>
          <div className="daylight-bg-circle"></div>
          <div className="daylight-bg-circle"></div>
        </div>
        <div className="daylight-content">
          <div className="daylight-header">
            <h1 className="daylight-title">Manage Daylight</h1>
            <p className="daylight-subtitle">Set sunrise and sunset times for each date</p>
          </div>
          <div className="daylight-card">
            <div className="daylight-loading">
              <div className="daylight-loading-spinner"></div>
              <div className="daylight-loading-text">Loading daylight data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="daylight-container">
      <div className="daylight-bg-animation">
        <div className="daylight-bg-circle"></div>
        <div className="daylight-bg-circle"></div>
        <div className="daylight-bg-circle"></div>
      </div>
      <div className="daylight-content">
        <div className="daylight-header">
          <div className="daylight-header-content">
            <h1 className="daylight-title">Manage Daylight</h1>
            <p className="daylight-subtitle">Set sunrise and sunset times for each date</p>
          </div>
        <div className="daylight-actions">
          {daylightData.length > 0 && (
            <button
              onClick={clearAllData}
              className="daylight-btn daylight-btn-danger"
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="daylight-btn daylight-btn-primary"
          >
            <Plus size={16} />
            Add Entry
          </button>
        </div>
        </div>

        {/* Add/Edit Daylight Modal */}
        {showForm && (
          <div className="daylight-modal-overlay" onClick={resetForm}>
            <div className="daylight-modal" onClick={(e) => e.stopPropagation()}>
              <div className="daylight-modal-header">
                <h3 className="daylight-modal-title">
                  {editingDaylight ? 'Edit Daylight Entry' : 'Add New Daylight Entry'}
                </h3>
                <button
                  onClick={resetForm}
                  className="daylight-modal-close-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="daylight-modal-body">
                <form onSubmit={handleSubmit} className="daylight-form">
              <div className="daylight-form-grid">
                <div className="daylight-form-group">
                  <label htmlFor="date" className="daylight-form-label">
                    Date
                  </label>
                  <div className="daylight-input-with-button">
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="daylight-form-input"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => fetchRealTimeData(formData.date)}
                      className="daylight-btn daylight-btn-secondary"
                      disabled={!formData.date}
                      title="Fetch real-time sunrise/sunset data"
                    >
                      <Sun size={16} />
                      Fetch Real-time
                    </button>
                  </div>
                </div>
                
                <div className="daylight-form-group">
                  <label htmlFor="timezone" className="daylight-form-label">
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="daylight-form-input"
                  >
                    {timezones.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            
              <div className="daylight-form-grid">
                <div className="daylight-form-group">
                  <label htmlFor="sunrise_time" className="daylight-form-label">
                    Sunrise Time
                  </label>
                  <input
                    type="time"
                    id="sunrise_time"
                    name="sunrise_time"
                    value={formData.sunrise_time}
                    onChange={handleInputChange}
                    className="daylight-form-input"
                    required
                  />
                </div>
                
                <div className="daylight-form-group">
                  <label htmlFor="sunset_time" className="daylight-form-label">
                    Sunset Time
                  </label>
                  <input
                    type="time"
                    id="sunset_time"
                    name="sunset_time"
                    value={formData.sunset_time}
                    onChange={handleInputChange}
                    className="daylight-form-input"
                    required
                  />
                </div>
              </div>
              
              <div className="daylight-form-group">
                <label htmlFor="notes" className="daylight-form-label">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="daylight-form-textarea"
                  rows={2}
                  placeholder="Optional notes"
                />
              </div>
              
              <div className="daylight-form-actions">
                <button
                  type="button"
                  onClick={resetForm}
                  className="daylight-btn daylight-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="daylight-btn daylight-btn-primary"
                >
                  <Save size={16} />
                  <span>{editingDaylight ? 'Update' : 'Create'} Entry</span>
                </button>
                </div>
                </form>
              </div>
            </div>
          </div>
        )}


        {/* Daylight Data List */}
        <div className="daylight-card">
          <div className="daylight-table-container">
            <table className="daylight-table">
              <thead className="daylight-table-header">
                <tr>
                  <th className="daylight-table-th">Date</th>
                  <th className="daylight-table-th">Sunrise</th>
                  <th className="daylight-table-th">Sunset</th>
                  <th className="daylight-table-th">Timezone</th>
                  <th className="daylight-table-th">Notes</th>
                  <th className="daylight-table-th daylight-table-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody className="daylight-table-body">
                {daylightData.map((daylight) => (
                  <tr key={daylight.id} className="daylight-table-row">
                    <td className="daylight-table-td">
                      <div className="daylight-table-cell">
                        <Calendar size={16} className="daylight-table-icon" />
                        <div className="daylight-table-text">
                          {new Date(daylight.date).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="daylight-table-td">
                      <div className="daylight-table-cell">
                        <Sun size={16} className="daylight-table-icon daylight-table-icon-sunrise" />
                        <div className="daylight-table-text">{daylight.sunrise_time}</div>
                      </div>
                    </td>
                    <td className="daylight-table-td">
                      <div className="daylight-table-cell">
                        <Sun size={16} className="daylight-table-icon daylight-table-icon-sunset" />
                        <div className="daylight-table-text">{daylight.sunset_time}</div>
                      </div>
                    </td>
                    <td className="daylight-table-td daylight-table-td-text">
                      {(() => {
                        const tz = daylight.timezone || 'Asia/Kolkata';
                        const tzOption = timezones.find(t => t.value === tz);
                        return tzOption ? tzOption.label : tz;
                      })()}
                    </td>
                    <td className="daylight-table-td daylight-table-td-notes">
                      {daylight.notes || '-'}
                    </td>
                    <td className="daylight-table-td daylight-table-td-actions">
                      <div className="daylight-table-actions">
                        <button
                          onClick={() => handleEdit(daylight)}
                          className="daylight-table-action daylight-table-action-edit"
                          title="Edit daylight entry"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(daylight)}
                          className="daylight-table-action daylight-table-action-delete"
                          title="Delete daylight entry"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {daylightData.length === 0 && (
              <div className="daylight-empty">
                <Sun size={64} className="daylight-empty-icon" />
                <h3 className="daylight-empty-title">No daylight data found</h3>
                <p className="daylight-empty-text">
                  Get started by adding your first daylight entry.
                </p>
                <button 
                  onClick={() => setShowForm(true)}
                  className="daylight-btn daylight-btn-primary"
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDaylight;
