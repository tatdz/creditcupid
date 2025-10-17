import axios from 'axios';

// Create axios instance with default config
export const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      throw new Error('Unable to connect to the server. Please check if the backend is running.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('API endpoint not found. The server might be misconfigured.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
);