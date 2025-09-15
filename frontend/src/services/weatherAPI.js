// Weather API service for fetching real-time sunrise/sunset data
const WEATHER_API_BASE_URL = 'https://api.sunrise-sunset.org/json';

// Default coordinates (can be made configurable)
const DEFAULT_LATITUDE = 28.6139; // New Delhi
const DEFAULT_LONGITUDE = 77.2090;

export const weatherAPI = {
  // Get sunrise/sunset data for a specific date and location
  getSunriseSunset: async (date, lat = DEFAULT_LATITUDE, lng = DEFAULT_LONGITUDE) => {
    try {
      const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
      const url = `${WEATHER_API_BASE_URL}?lat=${lat}&lng=${lng}&date=${dateStr}&formatted=0`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Weather API returned error: ${data.status}`);
      }
      
      return {
        success: true,
        data: {
          sunrise: data.results.sunrise,
          sunset: data.results.sunset,
          solar_noon: data.results.solar_noon,
          day_length: data.results.day_length,
          civil_twilight_begin: data.results.civil_twilight_begin,
          civil_twilight_end: data.results.civil_twilight_end,
          nautical_twilight_begin: data.results.nautical_twilight_begin,
          nautical_twilight_end: data.results.nautical_twilight_end,
          astronomical_twilight_begin: data.results.astronomical_twilight_begin,
          astronomical_twilight_end: data.results.astronomical_twilight_end,
          date: dateStr,
          latitude: lat,
          longitude: lng
        }
      };
    } catch (error) {
      console.error('Error fetching sunrise/sunset data:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  },

  // Get sunrise/sunset data for multiple dates
  getSunriseSunsetRange: async (startDate, endDate, lat = DEFAULT_LATITUDE, lng = DEFAULT_LONGITUDE) => {
    try {
      const results = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const result = await weatherAPI.getSunriseSunset(d, lat, lng);
        if (result.success) {
          results.push(result.data);
        }
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Error fetching sunrise/sunset range:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Get current location coordinates (if user allows)
  getCurrentLocation: () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
};

export default weatherAPI;
