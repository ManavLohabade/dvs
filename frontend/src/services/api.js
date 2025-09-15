import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and CORS issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.warn('Network error detected, this might be a CORS issue');
      // Don't redirect on CORS errors, just log and reject
    }
    
    return Promise.reject(error);
  }
);

// Add retry logic for failed requests
const retryRequest = async (config, retries = 3) => {
  try {
    return await api(config);
  } catch (error) {
    if (retries > 0 && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      console.log(`Retrying request... ${retries} attempts left`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return retryRequest(config, retries - 1);
    }
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getAllIncludingInactive: () => api.get('/categories/all'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (categoryData) => api.post('/categories', categoryData),
  update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Good Timings API
export const goodTimingsAPI = {
  getAll: (params = {}) => api.get('/good-timings', { params }),
  getById: (id) => api.get(`/good-timings/${id}`),
  create: (timingData) => api.post('/good-timings', timingData),
  update: (id, timingData) => api.put(`/good-timings/${id}`, timingData),
  delete: (id) => api.delete(`/good-timings/${id}`),
  addTimeSlot: (id, slotData) => api.post(`/good-timings/${id}/time-slots`, slotData),
  updateTimeSlot: (slotId, slotData) => api.put(`/good-timings/time-slots/${slotId}`, slotData),
  deleteTimeSlot: (slotId) => api.delete(`/good-timings/time-slots/${slotId}`),
};

// Daylight API
export const daylightAPI = {
  getAll: (params = {}) => api.get('/daylight', { params }),
  getByDate: (date) => api.get(`/daylight/${date}`),
  createOrUpdate: (date, daylightData) => api.put(`/daylight/${date}`, daylightData),
  delete: (date) => api.delete(`/daylight/${date}`),
  deleteAll: () => api.delete('/daylight/all'),
  bulkUpdate: (daylightData) => api.put('/daylight/bulk', { daylight_data: daylightData }),
};

// Weather API functions
export const weatherAPI = {
  // Get real-time daylight data
  getDaylight: (date, lat, lng) => api.get(`/weather/daylight/${date}`, { 
    params: { lat, lng } 
  }),
  
  // Get daylight data for date range
  getDaylightRange: (startDate, endDate, lat, lng) => api.get('/weather/daylight/range', {
    params: { start_date: startDate, end_date: endDate, lat, lng }
  }),
  
  // Update daylight data (admin only)
  updateDaylight: (date, data) => api.put(`/weather/daylight/${date}`, data),
  
  // Direct weather API calls (fallback) - imported from weatherAPI.js
  getSunriseSunset: async (date, lat, lng) => {
    const { weatherAPI: directWeatherAPI } = await import('./weatherAPI');
    return directWeatherAPI.getSunriseSunset(date, lat, lng);
  },
  getSunriseSunsetRange: async (startDate, endDate, lat, lng) => {
    const { weatherAPI: directWeatherAPI } = await import('./weatherAPI');
    return directWeatherAPI.getSunriseSunsetRange(startDate, endDate, lat, lng);
  },
  getCurrentLocation: async () => {
    const { weatherAPI: directWeatherAPI } = await import('./weatherAPI');
    return directWeatherAPI.getCurrentLocation();
  },
};

// Newsletter API functions
export const newsletterAPI = {
  // Subscribe to newsletter
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
  
  // Unsubscribe from newsletter
  unsubscribe: (email) => api.post('/newsletter/unsubscribe', { email }),
  
  // Get all subscribers (admin only)
  getSubscribers: () => api.get('/newsletter/subscribers'),
  
  // Send daily newsletter (admin only)
  sendDaily: () => api.post('/newsletter/send-daily'),
  
  // Preview newsletter (admin only)
  preview: () => api.get('/newsletter/preview'),
  
  // Send test email (admin only)
  testEmail: (email) => api.post('/newsletter/test-email', { email }),
};

// Calendar API functions
export const calendarAPI = {
  // Get all calendar events
  getAll: (params = {}) => api.get('/calendar', { params }),
  
  // Get single calendar event
  getById: (id) => api.get(`/calendar/${id}`),
  
  // Create new calendar event
  create: (eventData) => api.post('/calendar', eventData),
  
  // Update calendar event
  update: (id, eventData) => api.put(`/calendar/${id}`, eventData),
  
  // Delete calendar event
  delete: (id) => api.delete(`/calendar/${id}`),
  
  // Get calendar categories
  getCategories: () => api.get('/calendar/categories/list'),
};

export default api;
