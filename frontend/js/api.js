// API Integration for WorkCafe Website
// Changed from ES modules to traditional script

// Determine API base URL based on hostname, not process.env
const API_BASE_URL = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000/api' 
  : 'https://api.workcafe.com/api';

// Store auth token in localStorage
const getToken = () => localStorage.getItem('workcafe_token');
const setToken = (token) => localStorage.setItem('workcafe_token', token);
const removeToken = () => localStorage.removeItem('workcafe_token');

// Common headers with authentication
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Show/hide loading overlay
const showLoading = () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) loadingOverlay.classList.remove('hidden');
};

const hideLoading = () => {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) loadingOverlay.classList.add('hidden');
};

// API error handler
const handleError = (error) => {
  console.error('API Error:', error);
  hideLoading();
  
  // Check if error is unauthorized (401)
  if (error.status === 401) {
    // Clear token and redirect to login
    removeToken();
    window.location.href = '/login';
  }
  
  // Return formatted error for UI
  return {
    error: true,
    message: error.message || 'An unexpected error occurred',
    status: error.status
  };
};

// Authentication API
const auth = {
  // Register new user
  async register(userData) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      // Store token
      setToken(data.token);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Login user
  async login(credentials) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      // Store token
      setToken(data.token);
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Logout user
  logout() {
    removeToken();
    window.location.href = '/';
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    return !!getToken();
  },
  
  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Cafes API
const cafes = {
  // Get all cafes with pagination
  async getAllCafes(page = 1, limit = 10) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/cafes?page=${page}&limit=${limit}`, {
        headers: getHeaders()
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Search cafes with filters
  async searchCafes(searchParams) {
    showLoading();
    try {
      // Build query string from search params
      const queryParams = new URLSearchParams();
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(item => queryParams.append(`${key}[]`, item));
        } else if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      
      const response = await fetch(`${API_BASE_URL}/cafes/search?${queryParams}`, {
        headers: getHeaders()
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Find cafes near a location
  async findNearby(latitude, longitude, radius = 5, page = 1, limit = 10) {
    showLoading();
    try {
      const response = await fetch(
        `${API_BASE_URL}/cafes/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}&page=${page}&limit=${limit}`,
        { headers: getHeaders() }
      );
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Get a specific cafe
  async getCafeById(cafeId) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/cafes/${cafeId}`, {
        headers: getHeaders()
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Check in to a cafe
  async checkIn(cafeId, occupancyReport = null) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/cafes/${cafeId}/check-in`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ occupancy_report: occupancyReport })
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// User API
const user = {
  // Get user's favorite cafes
  async getFavorites(page = 1, limit = 10) {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/favorites?page=${page}&limit=${limit}`, {
        headers: getHeaders()
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Add cafe to favorites
  async addFavorite(cafeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/favorites/${cafeId}`, {
        method: 'POST',
        headers: getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Remove cafe from favorites
  async removeFavorite(cafeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/favorites/${cafeId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  },
  
  // Check out from current cafe
  async checkOut() {
    showLoading();
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/check-out`, {
        method: 'POST',
        headers: getHeaders()
      });
      
      const data = await response.json();
      hideLoading();
      
      if (!response.ok) {
        throw { status: response.status, message: data.message };
      }
      
      return data;
    } catch (error) {
      return handleError(error);
    }
  }
};

// Expose API to global scope (instead of ES modules)
window.WorkCafeAPI = {
  auth,
  cafes,
  user
};