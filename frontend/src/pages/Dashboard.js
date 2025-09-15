import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Sun, Plus } from 'lucide-react';
import { goodTimingsAPI, daylightAPI, categoriesAPI, weatherAPI } from '../services/api';
import { format } from 'date-fns';
import NewsletterForm from '../components/NewsletterForm';

const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    todayTimings: [],
    todayDaylight: null,
    todayDate: null,
    totalCategories: 0,
    totalGoodTimings: 0,
    loading: true
  });

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayDay = format(new Date(), 'EEEE'); // Use proper capitalization
      const todayDate = format(new Date(), 'MMMM d, yyyy'); // Full date format
      
      console.log('Dashboard Debug Info:');
      console.log('Today:', today);
      console.log('Today Day:', todayDay);
      
      // Fetch good timings for today's day specifically
      const [timingsResponse, categoriesResponse] = await Promise.all([
        goodTimingsAPI.getAll({ day: todayDay }),
        categoriesAPI.getAll()
      ]);

      const todayTimings = timingsResponse.data.good_timings || [];
      
      console.log('All Good Timings for', todayDay, ':', todayTimings);

      // Fetch real-time daylight data for all users
      let todayDaylight = null;
      try {
        console.log('Fetching real-time daylight data for:', today);
        const daylightResponse = await weatherAPI.getDaylight(today);
        console.log('Real-time daylight response:', daylightResponse.data);
        todayDaylight = daylightResponse.data.data;
      } catch (daylightError) {
        console.warn('Failed to fetch real-time daylight data, using fallback:', daylightError);
        // Fallback to stored daylight data
        try {
          console.log('Trying fallback daylight data for:', today);
          const fallbackResponse = await daylightAPI.getByDate(today);
          console.log('Fallback daylight response:', fallbackResponse.data);
          todayDaylight = fallbackResponse.data.daylight;
        } catch (fallbackError) {
          console.warn('Fallback daylight data also failed:', fallbackError);
        }
      }
      
      console.log('Final todayDaylight:', todayDaylight);

      setDashboardData({
        todayTimings,
        todayDaylight,
        todayDate,
        totalCategories: categoriesResponse.data.categories.length,
        totalGoodTimings: timingsResponse.data.good_timings.length,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading || dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600">Authentication Error</div>
          <div className="text-sm text-gray-600 mt-2">Please log in again</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Animated background elements */}
      <div className="dashboard-bg-animation">
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
        <div className="bg-orb bg-orb-3"></div>
      </div>
      
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-welcome">
            <div className="dashboard-logo">
              <Calendar className="dashboard-logo-icon" />
            </div>
            <h1 className="dashboard-title">
              Welcome back, {user.role === 'admin' ? 'Admin' : 'User'}!
          </h1>
          </div>
          <p className="dashboard-subtitle">
            {isAdmin() ? '✨ Manage your daily good timings and daylight settings with our stunning interface' : '🌟 View your daily good timings and schedule in a beautiful, organized way'}
          </p>
        </div>

        {/* Today's Overview */}
        <div className="overview-section">
          <h2 className="overview-title">Today's Overview</h2>
          <div className="overview-grid">
            <div className="timings-card">
              <div className="card-header">
                <div className="card-icon timings-icon">
                  <Clock className="icon" size={24} />
                </div>
                <h3 className="card-title">Good Timings</h3>
              </div>
              
              {dashboardData.todayTimings.length > 0 ? (
                <div className="timings-list">
                  {dashboardData.todayTimings.map((timing) => (
                    <div key={timing.id} className="timing-item">
                      <div className="timing-day">
                        <div className="day-name">{timing.day}</div>
                        <div className="day-date">{dashboardData.todayDate}</div>
                      </div>
                      {timing.time_slots && timing.time_slots.length > 0 ? (
                        <div className="time-slots">
                          {timing.time_slots.map((slot) => (
                            <div key={slot.id} className="time-slot">
                              <div className="time-range">
                                {slot.start_time} - {slot.end_time}
                    </div>
                              <span className={`category-badge category-${slot.category_color}`}>
                                {slot.category_name}
                              </span>
                              {slot.description && (
                                <p className="time-slot-description">{slot.description}</p>
                              )}
                    </div>
                          ))}
                  </div>
                      ) : (
                        <div className="no-slots">No time slots</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-timings-container">
                  <p className="no-timings">No timings scheduled for today</p>
                  <p className="no-timings-subtitle">Check back later or contact your administrator</p>
                </div>
              )}
              
              {isAdmin() && (
                <Link to="/admin/good-timings" className="btn btn-primary">
                  <Plus size={20} />
                  Add Timing
                </Link>
              )}
            </div>
            
            {/* Daylight Card - Show for both admin and users */}
            <div className="daylight-card">
              <div className="card-header">
                <div className="card-icon daylight-icon">
                  <Sun className="icon" size={24} />
                </div>
                <h3 className="card-title">Daylight Information</h3>
              </div>
              
              {dashboardData.todayDaylight ? (
                <div className="daylight-info">
                  <div className="daylight-item">
                    <div className="daylight-dot sunrise-dot"></div>
                    <p className="daylight-text">
                      Sunrise: {dashboardData.todayDaylight.sunrise_time}
                    </p>
                  </div>
                  <div className="daylight-item">
                    <div className="daylight-dot sunset-dot"></div>
                    <p className="daylight-text">
                      Sunset: {dashboardData.todayDaylight.sunset_time}
                    </p>
                  </div>
                  {dashboardData.todayDaylight.timezone && (
                    <p className="daylight-timezone">
                      Timezone: {dashboardData.todayDaylight.timezone}
                    </p>
                  )}
                </div>
              ) : (
                <div className="no-daylight-container">
                  <p className="no-daylight">No daylight data available</p>
                  <p className="no-daylight-subtitle">Sunrise and sunset times will appear here</p>
                </div>
              )}
              
              {isAdmin() && (
                <Link to="/admin/daylight" className="btn btn-secondary">
                  <Sun size={20} />
                  Edit Times
                </Link>
              )}
            </div>

          </div>
        </div>

        {/* Getting Started */}
        <div className="getting-started-section">
          <h2 className="getting-started-title">
            {isAdmin() ? 'Getting Started' : 'How to Use DVS'}
          </h2>
          <div className="steps-container">
            <Link to="/calendar" className="step-item step-1 step-clickable">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">View Your Calendar</h3>
                <p className="step-description">
                  {isAdmin() 
                    ? 'Check your daily and weekly good timings in our beautiful Google Calendar-like interface'
                    : 'Explore your daily and weekly good timings in our beautiful, easy-to-use calendar interface'
                  }
                </p>
              </div>
            </Link>
            
            {isAdmin() ? (
              <>
                <Link to="/admin/daylight" className="step-item step-2 step-clickable">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3 className="step-title">Set Daylight Times</h3>
                    <p className="step-description">Configure sunrise and sunset times for each day with our intuitive admin panel</p>
                  </div>
                </Link>
                
                <Link to="/admin/good-timings" className="step-item step-3 step-clickable">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3 className="step-title">Create Good Timings</h3>
                    <p className="step-description">Add time slots with categories and descriptions using our modern, colorful interface</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <div className="step-item step-2">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3 className="step-title">Check Today's Schedule</h3>
                    <p className="step-description">View your daily good timings and activities right here on your dashboard</p>
                  </div>
                </div>
                
                <div className="step-item step-3">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3 className="step-title">Stay Informed</h3>
                    <p className="step-description">Get updates on daylight times and schedule changes from your administrator</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Newsletter Subscription - Only for users */}
        {!isAdmin() && (
          <div className="newsletter-section">
            <div className="dashboard-newsletter-card">
              <div className="dashboard-newsletter-header">
                <div className="dashboard-newsletter-icon">
                  <Calendar className="icon" size={32} />
                </div>
                <div className="dashboard-newsletter-content">
                  <h2 className="dashboard-newsletter-title">Stay Updated Daily</h2>
                  <p className="dashboard-newsletter-subtitle">
                    Subscribe to our daily newsletter and receive your personalized good timings, 
                    daylight information, and inspirational quotes directly in your inbox.
                  </p>
                </div>
              </div>
              
              <NewsletterForm />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
