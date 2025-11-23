import React, { useState, useEffect, createContext, useContext } from 'react';
import { Car, Menu, X, User, ShoppingCart, Check, Loader2, Zap, Settings, Gauge, MapPin, DollarSign, Filter, Battery, Globe, Heart, Package, TrendingUp, Award, Leaf, ChevronLeft, ChevronRight, CreditCard, Lock, Clock } from 'lucide-react';

// ==========================================
// 0. API SERVICE (Real Backend Only - No Mock Fallback)
// ==========================================
const API_BASE = 'http://localhost:5001/api';

// Session storage keys
const SESSION_STORAGE_KEY = 'tesla_user_session';
const SESSION_TIMESTAMP_KEY = 'tesla_session_timestamp';
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

// Helper functions for session storage
const saveSessionToStorage = (userData) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save session to localStorage:', error);
  }
};

const getSessionFromStorage = () => {
  try {
    const userData = localStorage.getItem(SESSION_STORAGE_KEY);
    const timestamp = localStorage.getItem(SESSION_TIMESTAMP_KEY);

    if (!userData || !timestamp) return null;

    // Check if session is expired
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > SESSION_MAX_AGE) {
      clearSessionStorage();
      return null;
    }

    return JSON.parse(userData);
  } catch (error) {
    console.error('Failed to read session from localStorage:', error);
    return null;
  }
};

const clearSessionStorage = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Failed to clear session from localStorage:', error);
  }
};

const fetchWithAuth = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // CRITICAL: Allows the session cookie to pass
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Backend unavailable: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: response.ok,
      data,
      status: response.status,
      error: response.ok ? null : (data.message || 'Something went wrong')
    };

  } catch (error) {
    console.error(`Backend request failed: ${error.message}`);
    return {
      success: false,
      error: 'Unable to connect to server. Please ensure the backend is running.',
      status: 0
    };
  }
};

const authAPI = {
  login: (email, password) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name, email, password) => fetchWithAuth('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
  logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
  checkStatus: () => fetchWithAuth('/auth/check', { method: 'GET' }),
};

const orderAPI = {
  getOrders: () => fetchWithAuth('/orders', { method: 'GET' }),
  createOrder: (orderData) => fetchWithAuth('/orders', { method: 'POST', body: JSON.stringify(orderData) }),
};

const analyticsAPI = {
  track: (data) => fetchWithAuth('/analytics/track', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// 1. AUTH CONTEXT (State Management)
// ==========================================
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check Authentication on Mount and Page Refresh
  useEffect(() => {
    const initAuth = async () => {
      // First, check localStorage for cached session
      const cachedUser = getSessionFromStorage();
      if (cachedUser) {
        setUser(cachedUser);
      }

      // Then verify with backend
      const result = await authAPI.checkStatus();
      if (result.success && result.data && result.data.isAuthenticated) {
        setUser(result.data.user);
        saveSessionToStorage(result.data.user);
      } else {
        setUser(null);
        clearSessionStorage();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 2. Login Action
  const login = async (email, password) => {
    const result = await authAPI.login(email, password);
    if (result.success && result.data && result.data.user) {
      setUser(result.data.user);
      saveSessionToStorage(result.data.user);
      return { success: true };
    }

    if (result.status === 404) {
      return { success: false, error: 'Account not found', showSignupPopup: true };
    }

    return { success: false, error: result.error || 'Login failed' };
  };

  // 3. Signup Action
  const signup = async (name, email, password) => {
    const result = await authAPI.register(name, email, password);
    if (result.success && result.data && result.data.user) {
      setUser(result.data.user);
      saveSessionToStorage(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error || 'Signup failed' };
  };

  // 4. Logout Action
  const logout = async () => {
    await authAPI.logout();
    setUser(null);
    clearSessionStorage();
    sessionStorage.removeItem('currentConfig');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ==========================================
// ANALYTICS HELPER
// ==========================================
const trackEvent = (eventType, payload = {}) => {
  try {
    analyticsAPI.track({
      eventType,
      ...payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
  }
};

// ==========================================
// 2. ENHANCED VEHICLE DATA WITH VIDEOS & WHEEL/COLOR COMBINATIONS
// ==========================================
const VEHICLES = {
  model3: {
    id: 'model3',
    name: 'Model 3',
    tagline: 'Lease starting at $329/mo',
    basePrice: 38990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-3-Desktop-NA.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png',
    images: {
      white: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSW,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IBB1,$IPB0&view=STUD_SEAT&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      black: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PBSB,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IBB1,$IPB0&view=STUD_SEAT&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      blue: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSB,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IBB1,$IPB0&view=STUD_SEAT&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      red: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPMR,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IBB1,$IPB0&view=STUD_SEAT&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      gray: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PMNG,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IBB1,$IPB0&view=STUD_SEAT&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      }
    },
    wheels: {
      '18': {
        white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSW,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PBSB,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSB,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPMR,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PMNG,$W40B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      '19': {
        white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSW,$W41B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PBSB,$W41B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPSB,$W41B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PPMR,$W41B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&',
        gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MT322,$PMNG,$W41B,$IBB1&view=STUD_3QTR&model=m3&size=1920&bkba_opt=2&crop=0,0,0,0&'
      }
    },
    specs: { range: '272 mi', topSpeed: '125 mph', acceleration: '5.8s' },
    customization: {
      battery: [
        { id: 'standard', name: 'Standard Range', range: '272 mi', topSpeed: '125 mph', acceleration: '5.8s', price: 0 },
        { id: 'long', name: 'Long Range AWD', range: '341 mi', topSpeed: '135 mph', acceleration: '4.2s', price: 7500 },
        { id: 'performance', name: 'Performance', range: '315 mi', topSpeed: '162 mph', acceleration: '3.1s', price: 12500 }
      ],
      paint: [
        { id: 'white', name: 'Pearl White Multi-Coat', hex: '#f4f6f8', price: 0 },
        { id: 'black', name: 'Solid Black', hex: '#171a20', price: 1500 },
        { id: 'blue', name: 'Deep Blue Metallic', hex: '#1e3a8a', price: 1000 },
        { id: 'red', name: 'Ultra Red', hex: '#dc2626', price: 2000 },
        { id: 'gray', name: 'Midnight Silver Metallic', hex: '#71717a', price: 1000 }
      ],
      wheels: [
        { id: '18', name: '18" Aero Wheels', price: 0 },
        { id: '19', name: '19" Sport Wheels', price: 1500 }
      ],
      interior: [
        { id: 'black', name: 'All Black', price: 0, hex: '#000' },
        { id: 'white', name: 'Black & White', price: 1000, hex: '#fff' }
      ],
      autopilot: [
        { id: 'basic', name: 'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0 },
        { id: 'enhanced', name: 'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000 },
        { id: 'fsd', name: 'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 12000 }
      ]
    }
  },
  modelY: {
    id: 'modelY',
    name: 'Model Y',
    tagline: 'Lease starting at $379/mo',
    basePrice: 44990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Homepage-Model-Y-Global-Desktop',
    images: {
      white: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSW,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PB,$IPB0&view=STUD_SEAT&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      black: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PBSB,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PB,$IPB0&view=STUD_SEAT&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      blue: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSB,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PB,$IPB0&view=STUD_SEAT&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      red: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPMR,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PB,$IPB0&view=STUD_SEAT&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      gray: {
        exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PMNG,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PB,$IPB0&view=STUD_SEAT&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      }
    },
    wheels: {
      '19': {
        white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSW,$WY19B,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PBSB,$WY19B,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSB,$WY19B,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPMR,$WY19B,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PMNG,$WY19B,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      },
      '20': {
        white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSW,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PBSB,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPSB,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PPMR,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&',
        gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTY22,$PMNG,$WY20P,$IN3PB&view=STUD_3QTR&model=my&size=1920&bkba_opt=2&crop=0,0,0,0&'
      }
    },
    specs: { range: '310 mi', topSpeed: '135 mph', acceleration: '4.8s' },
    customization: {
      battery: [
        { id: 'long', name: 'Long Range AWD', range: '330 mi', topSpeed: '135 mph', acceleration: '4.8s', price: 0 },
        { id: 'performance', name: 'Performance', range: '303 mi', topSpeed: '155 mph', acceleration: '3.5s', price: 8000 }
      ],
      paint: [
        { id: 'white', name: 'Pearl White Multi-Coat', hex: '#f4f6f8', price: 0 },
        { id: 'black', name: 'Solid Black', hex: '#171a20', price: 1500 },
        { id: 'blue', name: 'Deep Blue Metallic', hex: '#1e3a8a', price: 1000 },
        { id: 'red', name: 'Ultra Red', hex: '#dc2626', price: 2000 },
        { id: 'gray', name: 'Midnight Silver Metallic', hex: '#71717a', price: 1000 }
      ],
      wheels: [
        { id: '19', name: '19" Gemini Wheels', price: 0 },
        { id: '20', name: '20" Induction Wheels', price: 2000 }
      ],
      interior: [
        { id: 'black', name: 'All Black', price: 0, hex: '#000' },
        { id: 'white', name: 'Black & White', price: 1000, hex: '#fff' }
      ],
      autopilot: [
        { id: 'basic', name: 'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0 },
        { id: 'enhanced', name: 'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000 },
        { id: 'fsd', name: 'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 12000 }
      ]
    }
  },
  modelS: {
    id: 'modelS',
    name: 'Model S',
    tagline: 'Plaid - 1,020 Horsepower',
    basePrice: 89990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-S-Desktop.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Model-S-homepage-desktop',
    images: {
      white: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSW,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      black: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PBSB,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      blue: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSB,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      red: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPMR,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      gray: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PMNG,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' }
    },
    wheels: {
      '19': { white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSW,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PBSB,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSB,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPMR,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PMNG,$W40B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      '21': { white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSW,$W41B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PBSB,$W41B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPSB,$W41B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PPMR,$W41B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&', gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTS15,$PMNG,$W41B,$IN3PW&view=STUD_3QTR&model=ms&size=1920&bkba_opt=2&crop=0,0,0,0&' }
    },
    specs: { range: '396 mi', topSpeed: '200 mph', acceleration: '1.99s' },
    customization: {
      battery: [
        { id: 'long', name: 'Long Range', range: '405 mi', topSpeed: '155 mph', acceleration: '3.1s', price: 0 },
        { id: 'plaid', name: 'Plaid', range: '396 mi', topSpeed: '200 mph', acceleration: '1.99s', price: 20000 }
      ],
      paint: [
        { id: 'white', name: 'Pearl White Multi-Coat', hex: '#f4f6f8', price: 0 },
        { id: 'black', name: 'Solid Black', hex: '#0a0a0a', price: 1500 },
        { id: 'blue', name: 'Deep Blue Metallic', hex: '#1e3a8a', price: 1000 },
        { id: 'red', name: 'Ultra Red', hex: '#dc2626', price: 2500 },
        { id: 'gray', name: 'Midnight Silver Metallic', hex: '#71717a', price: 1000 }
      ],
      wheels: [
        { id: '19', name: '19" Tempest Wheels', price: 0 },
        { id: '21', name: '21" Arachnid Wheels', price: 4500 }
      ],
      interior: [
        { id: 'black', name: 'All Black', price: 0, hex: '#000' },
        { id: 'cream', name: 'Cream', price: 2000, hex: '#f5f5dc' }
      ],
      autopilot: [
        { id: 'basic', name: 'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0 },
        { id: 'enhanced', name: 'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000 },
        { id: 'fsd', name: 'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 15000 }
      ]
    }
  },
  modelX: {
    id: 'modelX',
    name: 'Model X',
    tagline: 'Plaid - Up to 333 mi Range',
    basePrice: 94990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Homepage-Model-X-Desktop-NA.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Model-X-Main-Hero-Desktop-LHD',
    images: {
      white: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSW,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      black: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PBSB,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      blue: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSB,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      red: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPMR,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      gray: { exterior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PMNG,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$IN3PW,$IPB0&view=STUD_SEAT&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' }
    },
    wheels: {
      '20': { white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSW,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PBSB,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSB,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPMR,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PMNG,$WX20,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' },
      '22': { white: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSW,$WX00,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', black: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PBSB,$WX00,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', blue: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPSB,$WX00,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', red: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PPMR,$WX00,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&', gray: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$MTX13,$PMNG,$WX00,$IN3PW&view=STUD_3QTR&model=mx&size=1920&bkba_opt=2&crop=0,0,0,0&' }
    },
    specs: { range: '348 mi', topSpeed: '163 mph', acceleration: '2.5s' },
    customization: {
      battery: [
        { id: 'long', name: 'Long Range', range: '348 mi', topSpeed: '155 mph', acceleration: '3.8s', price: 0 },
        { id: 'plaid', name: 'Plaid', range: '333 mi', topSpeed: '163 mph', acceleration: '2.5s', price: 20000 }
      ],
      paint: [
        { id: 'white', name: 'Pearl White Multi-Coat', hex: '#f4f6f8', price: 0 },
        { id: 'black', name: 'Solid Black', hex: '#0a0a0a', price: 1500 },
        { id: 'blue', name: 'Deep Blue Metallic', hex: '#1e3a8a', price: 1000 },
        { id: 'red', name: 'Ultra Red', hex: '#dc2626', price: 2500 },
        { id: 'gray', name: 'Midnight Silver Metallic', hex: '#71717a', price: 1000 }
      ],
      wheels: [
        { id: '20', name: '20" Cyberstream Wheels', price: 0 },
        { id: '22', name: '22" Turbine Wheels', price: 5500 }
      ],
      interior: [
        { id: 'black', name: 'All Black', price: 0, hex: '#000' },
        { id: 'cream', name: 'Cream', price: 2000, hex: '#f5f5dc' }
      ],
      autopilot: [
        { id: 'basic', name: 'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0 },
        { id: 'enhanced', name: 'Enhanced Autopilot', features: ['Navigate on Autopilot', 'Auto Lane Change', 'Autopark', 'Summon'], price: 6000 },
        { id: 'fsd', name: 'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 15000 }
      ]
    }
  },
  cybertruck: {
    id: 'cybertruck',
    name: 'Cybertruck',
    tagline: 'Better utility than a truck. Faster than a sports car.',
    basePrice: 60990,
    video: 'https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Cybertruck-Homepage-Desktop.mp4',
    image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/h_1800,w_2880,c_fit,f_auto,q_auto:best/Homepage-Cybertruck-Desktop',
    images: {
      steel: { exterior: '/cybertruck-exterior.png', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$INYPW,$CPF0&view=INTERIOR&model=cc&size=1920&bkba_opt=1&crop=0,0,0,0&' },
      black: { exterior: '/cybertruck-exterior.png', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$INYPW,$CPF0&view=INTERIOR&model=cc&size=1920&bkba_opt=1&crop=0,0,0,0&' },
      white: { exterior: '/cybertruck-exterior.png', interior: 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&options=$INYPW,$CPF0&view=INTERIOR&model=cc&size=1920&bkba_opt=1&crop=0,0,0,0&' }
    },
    wheels: {
      '20': {
        steel: '/cybertruck-exterior.png',
        black: '/cybertruck-exterior.png',
        white: '/cybertruck-exterior.png'
      }
    },
    specs: { range: '340+ mi', topSpeed: '112 mph', acceleration: '2.6s' },
    customization: {
      battery: [
        { id: 'awd', name: 'All-Wheel Drive', range: '340 mi', topSpeed: '112 mph', acceleration: '4.1s', price: 0 },
        { id: 'beast', name: 'Cyberbeast', range: '320 mi', topSpeed: '130 mph', acceleration: '2.6s', price: 20000 }
      ],
      paint: [
        { id: 'steel', name: 'Stainless Steel', hex: '#c0c0c0', price: 0 },
        { id: 'black', name: 'Satin Black Wrap', hex: '#1a1a1a', price: 6500 },
        { id: 'white', name: 'Satin White Wrap', hex: '#f5f5f5', price: 6500 }
      ],
      wheels: [
        { id: '20', name: '20" Cybertruck Wheels', price: 0 }
      ],
      interior: [
        { id: 'black', name: 'All Black', price: 0, hex: '#000' },
        { id: 'white', name: 'Black & White', price: 1000, hex: '#fff' }
      ],
      autopilot: [
        { id: 'basic', name: 'Autopilot', features: ['Traffic-Aware Cruise Control', 'Autosteer'], price: 0 },
        { id: 'fsd', name: 'Full Self-Driving', features: ['Traffic Light and Stop Sign Control', 'Autosteer on City Streets'], price: 15000 }
      ]
    }
  }
};

// ==========================================
// 3. HD IMAGES & CONSTANTS
// ==========================================

const VEHICLE_HD_IMAGES = {
  modelS: {
    card: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Main-Hero-Desktop-LHD.jpg',
    hero: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-homepage-desktop.png'
  },
  model3: {
    card: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD_v2.png',
    hero: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png'
  },
  modelY: {
    card: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global_v2.jpg',
    hero: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.jpg'
  },
  modelX: {
    card: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Main-Hero-Desktop-LHD.jpg',
    hero: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-X-Desktop-NA.jpg'
  },
  cybertruck: {
    card: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Cybertruck-Desktop.jpg',
    hero: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Homepage-Desktop.png'
  }
};

const SHOP_CATEGORIES = {
  charging: { name: 'Charging', image: '/assets/shop_charging.jpg' },
  accessories: { name: 'Vehicle Accessories', image: '/assets/shop_accessories.jpg' },
  apparel: { name: 'Apparel', image: '/assets/shop_apparel.jpg' },
  lifestyle: { name: 'Lifestyle', image: '/assets/shop_lifestyle.jpg' }
};

const STATIC_INTERIORS = {
  modelS: [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Interior-Hero-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Interior-Grid-A-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-S-Interior-Grid-B-Desktop-LHD.jpg'
  ],
  model3: [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Interior-Hero-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Interior-Grid-A-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-3-Interior-Grid-B-Desktop-LHD.jpg'
  ],
  modelX: [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Interior-Hero-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Interior-Grid-A-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-X-Interior-Grid-B-Desktop-LHD.jpg'
  ],
  modelY: [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-Y-Interior-Hero-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-Y-Interior-Grid-A-Desktop-LHD.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-Y-Interior-Grid-B-Desktop-LHD.jpg'
  ],
  cybertruck: [
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Interior-Desktop.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Interior-Grid-A-Desktop.jpg',
    'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Cybertruck-Interior-Grid-B-Desktop.jpg'
  ]
};

// ==========================================
// 4. UI COMPONENTS
// ==========================================

// ==========================================
// NAVIGATION COMPONENT
// ==========================================
const Navigation = ({ currentPage, onNavigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 bg-[#020617]/90 backdrop-blur-xl text-white border-b border-white/10 shadow-2xl">
      <div className="flex justify-between items-center px-6 lg:px-12 py-3">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 z-50 hover:scale-105 transition-transform duration-300">
          <svg className="w-20 h-20" viewBox="0 0 342 35" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 .1a9.7 9.7 0 007 7h11l.5.1v27.6h6.8V7.3L26 7h11a9.8 9.8 0 007-7H0zm238.6 0h-6.8v34.8H263a9.7 9.7 0 006-6.8h-30.3V0zm-52.3 6.8c3.6-1 6.6-3.8 7.4-6.9l-38.1.1v20.6h31.1v7.2h-24.4a13.6 13.6 0 00-8.7 7h39.9v-21h-31.2v-7h24zm116.2 28h6.7v-14h24.6v14h6.7v-21h-38zM85.3 7h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 13.8h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zm0 14.1h26a9.6 9.6 0 007.1-7H78.3a9.6 9.6 0 007 7zM308.5 7h26a9.6 9.6 0 007-7h-40a9.6 9.6 0 007 7z" fill="currentColor" />
          </svg>
        </button>

        <div className="hidden lg:flex items-center justify-center flex-1 space-x-6 text-[13px] font-medium tracking-wide">
          <button onClick={() => onNavigate('vehicles')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white">Find Your Dream Tesla</button>
          <button onClick={() => onNavigate('advisor')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">✨ Smart Choice</button>
          <button onClick={() => onNavigate('servicing')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white">Servicing</button>
          <button onClick={() => onNavigate('charging')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white">Charging</button>
          <button onClick={() => onNavigate('discover')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white">Discover</button>
        </div>

        <div className="hidden lg:flex items-center gap-3 text-[13px] font-medium">
          <button onClick={() => onNavigate('contact')} className="hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-300 text-white">Contact Us</button>
          {user ? (
            <>
              <button
                onClick={() => onNavigate('account')}
                className="hover:bg-purple-50 px-3 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 hover:text-purple-600"
              >
                <User className="w-4 h-4" />
                {user.name || user.email.split('@')[0]}
              </button>
              <button
                onClick={() => {
                  logout();
                  onNavigate('home');
                }}
                className="hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-300 hover:text-red-600 text-red-400"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-300 hover:text-purple-600"
            >
              Account
            </button>
          )}
          <button
            onClick={() => setMenuOpen(true)}
            className="hover:bg-purple-50 px-3 py-2 rounded-lg transition-all duration-300 hover:text-purple-600"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(true)}
          className="lg:hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg text-[13px] font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
        </button>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-end">
          {/* Backdrop with fade in */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel with slide in */}
          <div className="relative w-full max-w-md h-full bg-white/95 backdrop-blur-2xl shadow-2xl animate-slide-in-right flex flex-col border-l border-white/20">

            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Menu</h2>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-8">

                {/* Vehicles Section */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Vehicles</p>
                  <div className="grid gap-2">
                    {Object.values(VEHICLES).map(v => (
                      <button
                        key={v.id}
                        onClick={() => { onNavigate('customize', v.id); setMenuOpen(false); }}
                        className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Services</p>
                  <div className="grid gap-2">
                    <button
                      onClick={() => { onNavigate('advisor'); setMenuOpen(false); }}
                      className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2 flex items-center gap-3"
                    >
                      <span className="text-xl">✨</span> Smart Choice Advisor
                    </button>
                    <button
                      onClick={() => { onNavigate('servicing'); setMenuOpen(false); }}
                      className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                    >
                      Servicing & Maintenance
                    </button>
                    <button
                      onClick={() => { onNavigate('charging'); setMenuOpen(false); }}
                      className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                    >
                      Charging Network
                    </button>
                    <button
                      onClick={() => { onNavigate('customer-care'); setMenuOpen(false); }}
                      className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                    >
                      Customer Care
                    </button>
                  </div>
                </div>

                {/* Account Section */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Account</p>
                  <div className="grid gap-2">
                    {user ? (
                      <>
                        <button
                          onClick={() => { onNavigate('account'); setMenuOpen(false); }}
                          className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2 flex items-center gap-3"
                        >
                          <User className="w-5 h-5 text-gray-500" />
                          My Account
                        </button>
                        <button
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                            onNavigate('home');
                          }}
                          className="text-left py-3 px-4 hover:bg-red-50 rounded-xl font-medium text-red-600 transition-all duration-200 hover:translate-x-2 flex items-center gap-3"
                        >
                          <span className="text-xl">🚪</span> Logout
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { onNavigate('login'); setMenuOpen(false); }}
                        className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                      >
                        Login / Sign Up
                      </button>
                    )}
                  </div>
                </div>

                {/* Support Section */}
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Support</p>
                  <div className="grid gap-2">
                    <button
                      onClick={() => { onNavigate('contact'); setMenuOpen(false); }}
                      className="text-left py-3 px-4 hover:bg-gray-50 rounded-xl font-medium text-gray-800 transition-all duration-200 hover:translate-x-2"
                    >
                      Contact Us
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const HeroSection = ({ vehicle, onSelect }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false);

  return (
    <div className="h-screen w-full relative snap-start overflow-hidden">
      {/* Video Background */}
      {vehicle.video && (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={vehicle.image}
          className="absolute inset-0 w-full h-full object-cover"
          onLoadedData={() => setMediaLoaded(true)}
        >
          <source src={vehicle.video} type="video/mp4" />
        </video>
      )}

      {/* Fallback Image */}
      {!mediaLoaded && (
        <img
          src={vehicle.image}
          alt={vehicle.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-between py-20 sm:py-28 pointer-events-none">
        <div className="text-center space-y-2 pt-16">
          <h1 className="text-5xl sm:text-6xl font-semibold text-slate-900 tracking-tight">{vehicle.name}</h1>
          <p className="text-base sm:text-lg text-slate-700 font-medium">{vehicle.tagline}</p>
          <div className="flex gap-6 justify-center text-sm font-medium pt-2">
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.range}</div>
              <div className="text-xs text-gray-600">Range (EPA est.)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.topSpeed}</div>
              <div className="text-xs text-gray-600">Top Speed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold">{vehicle.specs.acceleration}</div>
              <div className="text-xs text-gray-600">0-60 mph</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-6 pointer-events-auto">
          <button
            onClick={() => onSelect(vehicle.id)}
            className="flex-1 bg-gradient-to-r from-slate-900 to-slate-800 text-white py-3.5 px-8 rounded-lg font-bold text-base tracking-wide hover:from-slate-800 hover:to-slate-700 transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105 duration-300"
          >
            CUSTOMIZE YOUR ORDER
          </button>
          <button
            onClick={() => onSelect(`demo-drive-${vehicle.id}`)}
            className="flex-1 bg-white text-slate-900 py-3.5 px-8 rounded-lg font-bold text-base tracking-wide hover:bg-gray-100 transition-all shadow-2xl hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-105 duration-300 border-2 border-gray-200"
          >
            DEMO DRIVE
          </button>
        </div>
      </div>
    </div>
  );
};

const Homepage = ({ onSelectVehicle }) => (
  <div className="h-screen overflow-y-auto snap-y snap-mandatory scroll-smooth">
    {Object.values(VEHICLES).map(v => (
      <HeroSection key={v.id} vehicle={v} onSelect={onSelectVehicle} />
    ))}
  </div>
);

// VEHICLES PAGE - "Find Your Dream Tesla"
const VehiclesPage = ({ onSelect }) => (
  <div className="min-h-screen pt-24 pb-12 bg-slate-900 relative overflow-hidden">
    {/* Animated Background */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-S-Desktop-LHD.png')] bg-cover bg-center opacity-5 blur-3xl scale-110 animate-pulse" style={{ animationDuration: '10s' }}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-900"></div>
    </div>

    <div className="relative z-10 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-bold mb-6 text-white tracking-tight">
          Find Your Dream Tesla
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Explore our lineup of electric vehicles designed for performance, safety, and sustainability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Object.values(VEHICLES).map((vehicle, idx) => (
          <div
            key={vehicle.id}
            className="group cursor-pointer backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:shadow-red-900/20 hover:border-red-500/30 transition-all duration-500 hover:-translate-y-2"
            onClick={() => onSelect(vehicle.id)}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="aspect-[16/10] overflow-hidden bg-gradient-to-b from-white/5 to-transparent relative">
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.target.src = vehicle.images[Object.keys(vehicle.images)[0]].exterior;
                }}
              />
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-bold mb-2 text-white group-hover:text-red-500 transition-colors">{vehicle.name}</h2>
              <p className="text-gray-400 mb-6 h-12">{vehicle.tagline}</p>

              <div className="grid grid-cols-3 gap-4 mb-8 text-sm border-t border-white/10 pt-6">
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{vehicle.specs.range}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider mt-1">Range</div>
                </div>
                <div className="text-center border-l border-r border-white/10 px-2">
                  <div className="font-bold text-white text-lg">{vehicle.specs.topSpeed}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider mt-1">Top Speed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white text-lg">{vehicle.specs.acceleration}</div>
                  <div className="text-gray-500 text-xs uppercase tracking-wider mt-1">0-60 mph</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(vehicle.id); }}
                  className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Order
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(`demo-drive-${vehicle.id}`); }}
                  className="flex-1 bg-transparent text-white py-3 rounded-xl font-bold border border-white/30 hover:bg-white/10 transition-colors"
                >
                  Demo Drive
                </button>
              </div>

              <div className="mt-6 text-center">
                <span className="text-lg font-medium text-gray-400">
                  Starting at <span className="text-white">${vehicle.basePrice.toLocaleString()}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);


// ==========================================
// FLOATING TESLA ASSISTANT
// ==========================================
const TeslaAssistant = ({ step, preferences, loading }) => {
  const [message, setMessage] = useState("Hi! I'm your Tesla Guide. Let's find your dream car! 👋");
  const [isVisible, setIsVisible] = useState(true);
  const [isBouncing, setIsBouncing] = useState(false);

  // React to changes
  useEffect(() => {
    setIsBouncing(true);
    const timer = setTimeout(() => setIsBouncing(false), 1000);

    if (loading) {
      setMessage("Crunching the numbers... 🧠");
    } else if (step === 2) {
      setMessage("Ta-da! 🎉 Here are my top picks for you. What do you think?");
    } else {
      // Context-aware messages based on preferences
      if (preferences.priceRange.max > 100000) {
        setMessage("Wow, big budget! We can look at the Plaid models! 🚀");
      } else if (preferences.dailyDistance > 100) {
        setMessage("Long commute? I'll prioritize Long Range models for you. 🔋");
      } else if (preferences.passengers > 5) {
        setMessage("Big family? The Model X or Y would be perfect! 👨‍👩‍👧‍👦");
      } else if (preferences.style === 'Pickup') {
        setMessage("Cybertruck fan? Excellent choice! It's built for anything. 📐");
      } else if (preferences.cityHighwayRatio > 80) {
        setMessage("City driving? The Model 3 is super agile for that! 🏙️");
      } else {
        setMessage("Adjust the filters and I'll update my recommendations! 🎛️");
      }
    }
    return () => clearTimeout(timer);
  }, [preferences, step, loading]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">
      {/* Chat Bubble */}
      <div className={`mb-4 mr-4 bg-white text-gray-800 p-4 rounded-2xl rounded-br-none shadow-2xl max-w-xs transform transition-all duration-500 ${isBouncing ? 'scale-105' : 'scale-100'} animate-fadeIn`}>
        <p className="font-medium text-sm">{message}</p>
      </div>

      {/* Cute Car SVG Character */}
      <div
        className="relative w-32 h-24 cursor-pointer pointer-events-auto hover:scale-110 transition-transform duration-300"
        onClick={() => setIsBouncing(true)}
      >
        {/* Floating Animation Wrapper */}
        <div className="animate-bounce-slow">
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-2xl">
            {/* Car Body */}
            <path d="M20,90 Q20,50 60,40 L140,40 Q180,50 180,90 L180,110 Q180,130 160,130 L40,130 Q20,130 20,110 Z" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
            {/* Windshield (Eyes area) */}
            <path d="M40,90 Q40,50 60,50 L140,50 Q160,50 160,90 Z" fill="#334155" />
            {/* Eyes */}
            <circle cx="70" cy="75" r="8" fill="#db2777" className="animate-blink" />
            <circle cx="130" cy="75" r="8" fill="#db2777" className="animate-blink" />
            {/* Smile */}
            <path d="M85,105 Q100,115 115,105" fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            {/* Wheels */}
            <circle cx="50" cy="130" r="15" fill="#1e293b" />
            <circle cx="150" cy="130" r="15" fill="#1e293b" />
            {/* Blush */}
            <circle cx="55" cy="95" r="5" fill="#f472b6" opacity="0.6" />
            <circle cx="145" cy="95" r="5" fill="#f472b6" opacity="0.6" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .animate-blink {
          transform-origin: center;
          animation: blink 4s infinite;
        }
      `}</style>
    </div>
  );
};

// ==========================================
// ==========================================
// TESLA MODEL FINDER (SMART CHOICE)
// ==========================================
const AdvisorPage = ({ onSelect }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);

  const [preferences, setPreferences] = useState({
    priceRange: { min: 30000, max: 100000 },
    dailyDistance: 30,
    passengers: 5,
    style: 'Any',
    priority: 'Balanced', // Performance, Efficiency, Balanced
    towing: false,
    fsd: false // Full Self Driving Capability
  });

  const handleGetRecommendations = async () => {
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferences })
      });

      const data = await response.json();
      if (data.success && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setShowResultPopup(true);
      } else {
        // Fallback if no recommendations found (Robustness)
        console.warn('No recommendations found, using fallback');
        setRecommendations([{
          id: 'modelY',
          name: 'Model Y',
          basePrice: 43990,
          range: '310 mi',
          acceleration: '4.8s',
          topSpeed: '135 mph',
          image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.png',
          score: 95,
          reasons: ['Best selling model', 'Great balance of range & price', 'Fits your needs perfectly']
        }]);
        setShowResultPopup(true);
      }
    } catch (error) {
      console.error('Recommendation error:', error);
      // Fallback on error
      setRecommendations([{
        id: 'model3',
        name: 'Model 3',
        basePrice: 38990,
        range: '341 mi',
        acceleration: '4.2s',
        topSpeed: '125 mph',
        image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png',
        score: 90,
        reasons: ['Most affordable option', 'Excellent range', 'High efficiency']
      }]);
      setShowResultPopup(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 pt-24 pb-12 relative overflow-hidden font-sans">
      {/* Floating Assistant */}
      <TeslaAssistant step={step} preferences={preferences} loading={loading} />

      {/* Animated Background - Pink/Purple Theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black opacity-80"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 tracking-tighter">
            Smart Choice
          </h1>
          <p className="text-xl text-gray-400 font-light">Let our system find your perfect Tesla.</p>
        </div>

        {/* Filters Card */}
        <div className="backdrop-blur-2xl bg-zinc-900/50 border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {/* Glow Effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Price Range */}
            <div>
              <label className="block text-white font-medium mb-6 flex items-center gap-3">
                <span className="text-pink-500 text-xl">●</span>
                <span className="text-lg tracking-wide">MAX BUDGET</span>
              </label>
              <div className="space-y-6">
                <input
                  type="range"
                  min="30000"
                  max="150000"
                  step="5000"
                  value={preferences.priceRange.max}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    priceRange: { ...preferences.priceRange, max: parseInt(e.target.value) }
                  })}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-pink"
                />
                <div className="flex justify-between text-white font-medium items-end">
                  <span className="text-zinc-500">$30k</span>
                  <span className="text-4xl font-bold text-white">${preferences.priceRange.max.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Daily Distance */}
            <div>
              <label className="block text-white font-medium mb-6 flex items-center gap-3">
                <span className="text-pink-500 text-xl">●</span>
                <span className="text-lg tracking-wide">DAILY COMMUTE</span>
              </label>
              <div className="space-y-6">
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={preferences.dailyDistance}
                  onChange={(e) => setPreferences({ ...preferences, dailyDistance: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider-pink"
                />
                <div className="text-right">
                  <span className="text-4xl font-bold text-white">{preferences.dailyDistance}</span>
                  <span className="text-zinc-500 ml-2">miles / day</span>
                </div>
              </div>
            </div>

            {/* Passengers */}
            <div>
              <label className="block text-white font-medium mb-6 flex items-center gap-3">
                <span className="text-pink-500 text-xl">●</span>
                <span className="text-lg tracking-wide">PASSENGERS</span>
              </label>
              <div className="flex gap-4">
                {[5, 6, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setPreferences({ ...preferences, passengers: num })}
                    className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 border ${preferences.passengers === num
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent scale-105 shadow-lg shadow-purple-500/20'
                      : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                      }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-white font-medium mb-6 flex items-center gap-3">
                <span className="text-pink-500 text-xl">●</span>
                <span className="text-lg tracking-wide">PRIORITY</span>
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['Performance', 'Balanced', 'Efficiency'].map(p => (
                  <button
                    key={p}
                    onClick={() => setPreferences({ ...preferences, priority: p })}
                    className={`py-4 rounded-xl font-bold text-sm transition-all duration-300 border ${preferences.priority === p
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent scale-105 shadow-lg shadow-purple-500/20'
                      : 'bg-transparent text-zinc-400 border-zinc-700 hover:border-zinc-500 hover:text-white'
                      }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles: Towing & FSD */}
            <div className="md:col-span-2 grid md:grid-cols-2 gap-6">
              {/* Towing Toggle */}
              <div className="flex items-center justify-between bg-zinc-800/50 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                onClick={() => setPreferences({ ...preferences, towing: !preferences.towing })}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🚛</span>
                  <div>
                    <h3 className="text-white font-bold text-lg">Towing Capability</h3>
                    <p className="text-zinc-500 text-sm">Need to tow a trailer or boat</p>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full transition-colors relative ${preferences.towing ? 'bg-pink-600' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${preferences.towing ? 'left-7' : 'left-1'}`} />
                </div>
              </div>

              {/* FSD Toggle */}
              <div className="flex items-center justify-between bg-zinc-800/50 p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer group"
                onClick={() => setPreferences({ ...preferences, fsd: !preferences.fsd })}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
                  <div>
                    <h3 className="text-white font-bold text-lg">Full Self-Driving</h3>
                    <p className="text-zinc-500 text-sm">Prioritize FSD hardware</p>
                  </div>
                </div>
                <div className={`w-14 h-8 rounded-full transition-colors relative ${preferences.fsd ? 'bg-pink-600' : 'bg-zinc-700'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-md ${preferences.fsd ? 'left-7' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>

          {/* Get Recommendations Button */}
          <button
            onClick={handleGetRecommendations}
            disabled={loading}
            className="mt-12 w-full bg-white text-black py-6 rounded-xl font-bold text-xl hover:bg-gray-200 hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            {loading ? (
              <>
                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing Configuration...</span>
              </>
            ) : (
              <span>Find My Tesla</span>
            )}
          </button>
        </div>
      </div>

      {/* RESULT POPUP MODAL */}
      {showResultPopup && recommendations && recommendations.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowResultPopup(false)}></div>

          <div className="relative bg-zinc-900 border border-white/10 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row animate-scaleIn">
            {/* Close Button */}
            <button
              onClick={() => setShowResultPopup(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Section */}
            <div className="md:w-1/2 bg-gradient-to-br from-zinc-800 to-black relative flex items-center justify-center p-8">
              <div className="absolute top-6 left-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                Best Match
              </div>
              <img
                src={recommendations[0].image}
                alt={recommendations[0].name}
                className="w-full object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
              />
            </div>

            {/* Content Section */}
            <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center bg-zinc-900/95 backdrop-blur-xl">
              <h2 className="text-sm font-bold text-pink-500 tracking-widest uppercase mb-2">HERE'S THE BEST CAR FOR YOU</h2>
              <h3 className="text-4xl font-bold text-white mb-4">{recommendations[0].name}</h3>

              <div className="text-3xl font-bold text-white mb-8">
                ${recommendations[0].basePrice.toLocaleString()}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Range</div>
                  <div className="text-white font-bold text-lg">{recommendations[0].range}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="text-zinc-400 text-xs uppercase tracking-wider mb-1">0-60 mph</div>
                  <div className="text-white font-bold text-lg">{recommendations[0].acceleration}</div>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {recommendations[0].reasons.map((reason, i) => (
                  <div key={i} className="flex items-center gap-3 text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs">✓</div>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setShowResultPopup(false);
                  onSelect(recommendations[0].id);
                }}
                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:bg-gray-200 hover:scale-[1.02] transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2"
              >
                <span>Order Now</span>
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .slider-pink::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #db2777; /* Pink-600 */
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(219, 39, 119, 0.5);
        }
        .slider-pink::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #db2777;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(219, 39, 119, 0.5);
        }
      `}</style>
    </div>
  );
};

// ENHANCED CONFIGURATOR WITH EXTERIOR/INTERIOR TOGGLE
const Configurator = ({ vehicleId, onBack, onNavigate }) => {
  const vehicle = VEHICLES[vehicleId];
  const { user } = useAuth();

  const [config, setConfig] = useState({
    battery: vehicle.customization.battery[0].id,
    paint: vehicle.customization.paint[0].id,
    wheels: vehicle.customization.wheels[0].id,
    interior: vehicle.customization.interior[0].id,
    autopilot: vehicle.customization.autopilot[0].id
  });

  const [currentImage, setCurrentImage] = useState('');
  const [viewMode, setViewMode] = useState('exterior'); // 'exterior' or 'interior'
  const [imageLoading, setImageLoading] = useState(false);
  const [currentInteriorIndex, setCurrentInteriorIndex] = useState(0);

  const selectedBattery = vehicle.customization.battery.find(b => b.id === config.battery);
  const selectedPaint = vehicle.customization.paint.find(p => p.id === config.paint);
  const selectedWheels = vehicle.customization.wheels.find(w => w.id === config.wheels);
  const selectedInterior = vehicle.customization.interior.find(i => i.id === config.interior);
  const selectedAutopilot = vehicle.customization.autopilot.find(a => a.id === config.autopilot);

  const totalPrice = vehicle.basePrice +
    (selectedBattery?.price || 0) +
    (selectedPaint?.price || 0) +
    (selectedWheels?.price || 0) +
    (selectedInterior?.price || 0) +
    (selectedAutopilot?.price || 0);

  // Update image when paint, wheels, or view mode changes
  useEffect(() => {
    setImageLoading(true);

    let newImage = null;

    if (viewMode === 'interior') {
      // Use reliable static interior images
      if (STATIC_INTERIORS[vehicleId]) {
        const images = STATIC_INTERIORS[vehicleId];
        newImage = Array.isArray(images) ? images[currentInteriorIndex] : images;
      } else {
        // Fallback to vehicle data if static not found
        newImage = vehicle.images[config.paint]?.interior;
      }
    } else {
      // Exterior with wheels - IMPROVED FALLBACK LOGIC
      // First try: wheels mapping with exact paint color
      if (vehicle.wheels?.[config.wheels]?.[config.paint]) {
        newImage = vehicle.wheels[config.wheels][config.paint];
      }
      // Second try: base images if wheels mapping doesn't exist
      else if (vehicle.images[config.paint]?.exterior) {
        newImage = vehicle.images[config.paint].exterior;
      }
      // Third try: use first available paint color's exterior
      else {
        const firstPaint = Object.keys(vehicle.images)[0];
        newImage = vehicle.images[firstPaint]?.exterior;
      }
    }

    if (newImage) {
      setCurrentImage(newImage);
    } else {
      // Ultimate fallback - use vehicle's hero image
      console.warn('No image found for config:', config);
      setCurrentImage(vehicle.image);
    }

    // Simulate loading delay for smooth transition
    setTimeout(() => setImageLoading(false), 300);

    // Track config changes (debounced ideally, but simple here)
    if (config.paint || config.wheels) {
      trackEvent('config_change', {
        vehicleId,
        paint: config.paint,
        wheels: config.wheels,
        viewMode
      });
    }
  }, [config.paint, config.wheels, viewMode, vehicle, vehicleId, currentInteriorIndex, config]);

  const handleOrder = async () => {
    trackEvent('customize_order_click', { vehicleId: vehicle.id, config });
    if (!user) {
      alert('Please login to place an order');
      onNavigate('login');
      return;
    }

    const orderData = {
      vehicleId,
      vehicleName: vehicle.name,
      config,
      selectedOptions: {
        battery: selectedBattery,
        paint: selectedPaint,
        wheels: selectedWheels,
        interior: selectedInterior,
        autopilot: selectedAutopilot
      },
      totalPrice
    };

    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    onNavigate('payment');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row pt-16 lg:pt-0 bg-gradient-to-br from-slate-50 to-purple-50">
      {/* LEFT: Car Preview */}
      <div className="flex-1 h-[50vh] lg:h-screen bg-gradient-to-br from-white to-purple-50 relative">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-10 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-xl hover:bg-white hover:scale-110 transition-all duration-300 border border-purple-100"
        >
          <X className="w-5 h-5 text-slate-700" />
        </button>

        {/* View Mode Toggle */}
        <div className="absolute top-6 right-6 z-10 bg-white/90 backdrop-blur-md rounded-full shadow-xl p-1.5 flex gap-1 border border-purple-100">
          <button
            onClick={() => setViewMode('exterior')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${viewMode === 'exterior'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-purple-50'
              }`}
          >
            <Car className="w-4 h-4 inline mr-1" />
            Exterior
          </button>
          <button
            onClick={() => setViewMode('interior')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${viewMode === 'interior'
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
              : 'text-slate-600 hover:bg-purple-50'
              }`}
          >
            <Gauge className="w-4 h-4 inline mr-1" />
            Interior
          </button>
        </div>

        <div className={`w-full h-full flex items-center justify-center relative transition-opacity duration-500 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}>
          {/* Podium Effect */}
          {viewMode === 'exterior' && (
            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[70%] h-[15%] bg-black/20 blur-2xl rounded-[100%] transform scale-y-50 pointer-events-none animate-pulse"></div>
          )}
          {viewMode === 'exterior' && (
            <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm"></div>
          )}

          <img
            src={currentImage}
            alt="Configuration Preview"
            className={`w-full h-full object-contain p-8 transition-all duration-700 ${viewMode === 'exterior' ? (vehicleId === 'cybertruck' ? 'hover:rotate-12 hover:scale-110 drop-shadow-2xl' : 'hover:scale-105 drop-shadow-2xl') : 'scale-110'}`}
            key={currentImage}
            onError={(e) => {
              console.warn('Image failed to load, falling back to hero:', currentImage);
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = vehicle.image;
            }}
          />

          {/* Interior Carousel Controls */}
          {viewMode === 'interior' && Array.isArray(STATIC_INTERIORS[vehicleId]) && (
            <>
              <button
                onClick={() => setCurrentInteriorIndex(prev => prev === 0 ? STATIC_INTERIORS[vehicleId].length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 text-white z-20 transition-all hover:scale-110"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentInteriorIndex(prev => prev === STATIC_INTERIORS[vehicleId].length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md p-2 rounded-full hover:bg-white/20 text-white z-20 transition-all hover:scale-110"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {STATIC_INTERIORS[vehicleId].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentInteriorIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentInteriorIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-xl px-8 py-5 rounded-2xl shadow-2xl border border-purple-200">
          <div className="text-sm text-gray-600 font-medium mb-1">Your {vehicle.name}</div>
          <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ${totalPrice.toLocaleString()}
          </div>
        </div>
      </div>

      {/* RIGHT: Configuration Panel */}
      <div className="w-full lg:w-[480px] bg-white p-8 flex flex-col gap-6 overflow-y-auto h-[50vh] lg:h-screen border-l border-purple-100 shadow-2xl">
        <div className="space-y-2 pb-4 border-b border-purple-100">
          <h2 className="text-4xl font-semibold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">{vehicle.name}</h2>
          <p className="text-gray-600 text-sm">Est. Delivery: 2-4 Weeks</p>
        </div>

        {/* Current Specs */}
        <div className="grid grid-cols-3 gap-4 py-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl px-4 border border-purple-100 shadow-sm">
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedBattery?.range}</div>
            <div className="text-xs text-gray-600 font-medium">Range</div>
          </div>
          <div className="text-center border-x border-purple-200">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedBattery?.topSpeed}</div>
            <div className="text-xs text-gray-600 font-medium">Top Speed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{selectedBattery?.acceleration}</div>
            <div className="text-xs text-gray-600 font-medium">0-60 mph</div>
          </div>
        </div>

        {/* Battery Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Battery</h3>
          </div>
          <div className="space-y-2">
            {vehicle.customization.battery.map(b => (
              <button
                key={b.id}
                onClick={() => setConfig({ ...config, battery: b.id })}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${config.battery === b.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg shadow-purple-200/50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-slate-900">{b.name}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {b.range} • {b.acceleration} 0-60mph • {b.topSpeed} top speed
                    </div>
                  </div>
                  <div className="font-semibold text-slate-900">
                    {b.price === 0 ? 'Included' : `+${b.price.toLocaleString()}`}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Paint Color */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Paint</h3>
          <div className="flex gap-3 flex-wrap">
            {vehicle.customization.paint.map(p => (
              <button
                key={p.id}
                onClick={() => setConfig({ ...config, paint: p.id })}
                className="relative group"
                title={`${p.name} ${p.price > 0 ? `(+${p.price.toLocaleString()})` : ''}`}
              >
                <div
                  className={`w-14 h-14 rounded-full shadow-lg border-4 transition-all duration-300 ${config.paint === p.id
                    ? 'border-purple-600 scale-110 shadow-xl shadow-purple-300/50 ring-4 ring-purple-200'
                    : 'border-gray-200 hover:scale-105 hover:border-purple-300'
                    }`}
                  style={{ background: p.hex }}
                />
                {config.paint === p.id && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full shadow-lg"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedPaint && (
            <div className="text-sm text-gray-600 font-medium">
              {selectedPaint.name} {selectedPaint.price > 0 && `(+${selectedPaint.price.toLocaleString()})`}
            </div>
          )}
        </div>

        {/* Wheels */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Wheels</h3>
          <div className="grid grid-cols-2 gap-3">
            {vehicle.customization.wheels.map(w => (
              <button
                key={w.id}
                onClick={() => setConfig({ ...config, wheels: w.id })}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${config.wheels === w.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg shadow-purple-200/50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
              >
                <div className="text-4xl mb-2">⚙️</div>
                <div className="text-sm font-semibold text-slate-900">{w.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {w.price === 0 ? 'Included' : `+${w.price.toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Interior */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Interior</h3>
          <div className="grid grid-cols-2 gap-3">
            {vehicle.customization.interior.map(i => (
              <button
                key={i.id}
                onClick={() => setConfig({ ...config, interior: i.id })}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${config.interior === i.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg shadow-purple-200/50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
              >
                <div
                  className="w-full h-16 rounded-lg mb-3 border-2 border-gray-300 shadow-inner"
                  style={{ background: i.hex }}
                />
                <div className="text-sm font-semibold text-slate-900">{i.name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {i.price === 0 ? 'Included' : `+${i.price.toLocaleString()}`}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Autopilot */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Autopilot</h3>
          </div>
          <div className="space-y-2">
            {vehicle.customization.autopilot.map(a => (
              <button
                key={a.id}
                onClick={() => setConfig({ ...config, autopilot: a.id })}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${config.autopilot === a.id
                  ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg shadow-purple-200/50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-900">{a.name}</div>
                  <div className="font-semibold text-slate-900">
                    {a.price === 0 ? 'Included' : `+${a.price.toLocaleString()}`}
                  </div>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {a.features.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="w-3 h-3 text-green-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Table */}
        <div className="space-y-3 py-4 border-t border-purple-100">
          <h3 className="font-semibold text-lg">Payment Options</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border-2 border-purple-500 bg-purple-50 text-center">
              <div className="text-sm font-bold text-purple-900">Cash</div>
              <div className="text-lg font-bold">${totalPrice.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl border border-gray-200 text-center hover:border-purple-300 transition-colors">
              <div className="text-sm font-medium text-gray-600">Finance</div>
              <div className="text-lg font-bold">₹{Math.round(totalPrice * 83 / 60).toLocaleString()}/mo</div>
              <div className="text-[10px] text-gray-500">60mo @ 6%</div>
            </div>
            <div className="p-3 rounded-xl border border-gray-200 text-center hover:border-purple-300 transition-colors">
              <div className="text-sm font-medium text-gray-600">Lease</div>
              <div className="text-lg font-bold">${Math.round(totalPrice / 36).toLocaleString()}/mo</div>
              <div className="text-[10px] text-gray-500">36mo</div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mt-auto pt-6 border-t border-purple-100 space-y-4 sticky bottom-0 bg-white pb-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between font-medium">
              <span className="text-gray-700">Base Price</span>
              <span className="text-slate-900">${vehicle.basePrice.toLocaleString()}</span>
            </div>
            {selectedBattery?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedBattery.name}</span>
                <span>+${selectedBattery.price.toLocaleString()}</span>
              </div>
            )}
            {selectedPaint?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedPaint.name}</span>
                <span>+${selectedPaint.price.toLocaleString()}</span>
              </div>
            )}
            {selectedWheels?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedWheels.name}</span>
                <span>+${selectedWheels.price.toLocaleString()}</span>
              </div>
            )}
            {selectedInterior?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedInterior.name}</span>
                <span>+${selectedInterior.price.toLocaleString()}</span>
              </div>
            )}
            {selectedAutopilot?.price > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>{selectedAutopilot.name}</span>
                <span>+${selectedAutopilot.price.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between text-xl font-bold pt-3 border-t border-purple-100">
            <span className="text-slate-900">Total Price</span>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">${totalPrice.toLocaleString()}</span>
          </div>

          <button
            onClick={handleOrder}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-purple-300/50 hover:shadow-2xl hover:scale-[1.02]"
          >
            <ShoppingCart className="w-5 h-5" />
            Order Now
          </button>

          {!user && (
            <p className="text-xs text-center text-gray-500">
              You must be logged in to place an order
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Signup Popup Component
const SignupPopup = ({ email, onClose, onSwitchToSignup }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full z-10">
      <h3 className="text-2xl font-semibold text-slate-900 mb-4">Account Not Found</h3>
      <p className="text-gray-600 mb-6">
        No account found with email <span className="font-medium text-slate-900">{email}</span>.
        Please create an account first to continue.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onSwitchToSignup}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          Create Account
        </button>
        <button
          onClick={onClose}
          className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// Login Component
const Login = ({ onNavigate }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowSignupPopup(false);

    try {
      const res = isSignup
        ? await signup(data.name, data.email, data.password)
        : await login(data.email, data.password);

      if (res.success) {
        onNavigate('home');
      } else {
        if (res.showSignupPopup) {
          setShowSignupPopup(true);
        } else {
          setError(res.error || 'Authentication failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToSignup = () => {
    setShowSignupPopup(false);
    setIsSignup(true);
    setError('');
  };

  return (
    <>
      {showSignupPopup && (
        <SignupPopup
          email={data.email}
          onClose={() => setShowSignupPopup(false)}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-2xl space-y-6 border border-purple-100">
          <h2 className="text-3xl font-semibold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">{isSignup ? 'Create Account' : 'Sign In'}</h2>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <input
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    value={data.name}
                    onChange={e => setData({ ...data, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Region</label>
                  <select
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                    value={data.region || ''}
                    onChange={e => setData({ ...data, region: e.target.value })}
                  >
                    <option value="">Select your region</option>
                    <option value="us-west">US West</option>
                    <option value="us-east">US East</option>
                    <option value="us-central">US Central</option>
                    <option value="europe">Europe</option>
                    <option value="asia">Asia Pacific</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                required
                type="email"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                value={data.email}
                onChange={e => setData({ ...data, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                required
                type="password"
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                value={data.password}
                onChange={e => setData({ ...data, password: e.target.value })}
              />
            </div>
            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 flex justify-center items-center disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? 'Create Account' : 'Sign In')}
            </button>
          </form>
          <div className="text-center">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); setShowSignupPopup(false); }}
              className="text-sm text-purple-600 hover:underline underline-offset-4 font-medium"
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Account Page Component
const AccountPage = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setLoading(true);
        const result = await orderAPI.getOrders();
        if (result.success && result.data) {
          setOrders(result.data.orders || result.data);
        }
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="text-center bg-white p-12 rounded-2xl shadow-2xl border border-purple-100">
          <User className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h2 className="text-2xl font-semibold mb-4 text-slate-900">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your account</p>
          <button
            onClick={() => onNavigate('login')}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-6 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6 border border-purple-100">
          <div className="flex justify-between items-start border-b border-purple-100 pb-6">
            <div>
              <h1 className="text-4xl font-semibold bg-gradient-to-r from-slate-900 to-purple-900 bg-clip-text text-transparent">My Account</h1>
              <p className="text-gray-600 mt-2">Manage your Tesla profile and orders</p>
            </div>
            <button
              onClick={() => onNavigate('home')}
              className="text-purple-600 hover:underline font-medium underline-offset-4"
            >
              ← Back to Home
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Name</label>
              <div className="text-xl font-semibold text-slate-900">{user.name || 'N/A'}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Email</label>
              <div className="text-xl font-semibold text-slate-900">{user.email}</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">Region</label>
              <div className="text-xl font-semibold text-slate-900">{user.region || 'Not set'}</div>
            </div>
          </div>

          <div className="border-t border-purple-100 pt-6">
            <h3 className="text-2xl font-semibold mb-4 text-slate-900">Order History</h3>
            {loading ? (
              <div className="text-center p-12">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-12 text-center border-2 border-dashed border-purple-300">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <p className="text-gray-600 font-medium mb-2">No orders yet</p>
                <p className="text-sm text-gray-500">Configure and order your dream Tesla!</p>
                <button
                  onClick={() => onNavigate('home')}
                  className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
                >
                  Browse Vehicles
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div key={order._id || index} className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-semibold text-slate-900">{order.vehicleName}</h4>
                        <p className="text-sm text-gray-600">Order #{(order._id || '').slice(-8)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">${order.totalPrice?.toLocaleString() || '0'}</div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {order.selectedOptions && (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Battery:</span>
                          <p className="font-medium">{order.selectedOptions.battery?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Paint:</span>
                          <p className="font-medium">{order.selectedOptions.paint?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Wheels:</span>
                          <p className="font-medium">{order.selectedOptions.wheels?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Interior:</span>
                          <p className="font-medium">{order.selectedOptions.interior?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Autopilot:</span>
                          <p className="font-medium">{order.selectedOptions.autopilot?.name || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-purple-200">
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        {order.status || 'Paid'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-purple-100 pt-6 flex gap-4">
            <button
              onClick={() => onNavigate('home')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Browse Vehicles
            </button>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. NEW PREMIUM PAGES
// ==========================================

const ScrollProgress = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setWidth(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
      <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-100" style={{ width: `${width}%` }} />
    </div>
  );
};

const AnimatedStat = ({ value, label, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/,/g, ''));
    if (isNaN(end)) return;

    const duration = 2000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
      <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-400 font-medium">{label}</div>
    </div>
  );
};



const ChargingPage = () => (
  <div className="min-h-screen bg-[#020617]">
    {/* Hero Section */}
    <div className="relative h-[80vh] overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      >
        <source src="https://digitalassets.tesla.com/tesla-contents/video/upload/f_auto,q_auto/Supercharger-Hero-Desktop-NA.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#020617]" />

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
          Power Anywhere
        </h1>
        <p className="text-xl text-gray-200 max-w-2xl mb-10">
          Go anywhere with the world's largest and most reliable fast charging network.
        </p>
        <button className="bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-200 transition-all transform hover:scale-105">
          Find a Supercharger
        </button>
      </div>
    </div>

    {/* Stats Section */}
    <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
      <div className="grid md:grid-cols-4 gap-6">
        <AnimatedStat value="50000" label="Superchargers" suffix="+" />
        <AnimatedStat value="15" label="Minutes to Charge" suffix=" min" />
        <AnimatedStat value="99.9" label="Network Uptime" suffix="%" />
        <AnimatedStat value="24" label="Support Available" suffix="/7" />
      </div>
    </div>

    {/* Tech Section */}
    <div className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Charging Solutions</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-purple-500/30 transition-all group">
            <img
              src="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Home-Charging-Wall-Connector-Desktop.jpg"
              alt="Home Charging"
              className="w-full h-64 object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-500"
            />
            <h3 className="text-2xl font-bold text-white mb-4">Home Charging</h3>
            <p className="text-gray-400 mb-6">
              Wake up to a full charge every morning. Wall Connector is the most convenient charging solution for houses, apartments, condos and workplaces.
            </p>
            <button className="text-purple-400 font-semibold group-hover:text-purple-300 flex items-center gap-2">
              Shop Wall Connector <TrendingUp className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-purple-500/30 transition-all group">
            <img
              src="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Supercharging-Desktop-Global.jpg"
              alt="Supercharging"
              className="w-full h-64 object-cover rounded-2xl mb-6 group-hover:scale-105 transition-transform duration-500"
            />
            <h3 className="text-2xl font-bold text-white mb-4">On the Road</h3>
            <p className="text-gray-400 mb-6">
              Superchargers are located on major routes near convenient amenities. Plug in, grab a coffee and get back on the road.
            </p>
            <button className="text-purple-400 font-semibold group-hover:text-purple-300 flex items-center gap-2">
              View Map <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DiscoverPage = () => (
  <div className="min-h-screen bg-[#020617] pt-24 pb-12 px-6">
    <div className="max-w-7xl mx-auto space-y-24">

      {/* Offers Section */}
      <section>
        <h2 className="text-4xl font-bold text-white mb-8">Current Offers</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative h-96 rounded-3xl overflow-hidden group cursor-pointer">
            <img
              src="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.jpg"
              alt="Model Y Offer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
              <span className="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">LIMITED TIME</span>
              <h3 className="text-3xl font-bold text-white mb-2">Model Y 0.99% APR</h3>
              <p className="text-gray-200 mb-6">Finance Model Y starting at 0.99% APR for 36 to 72 months.</p>
              <button className="bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                View Inventory
              </button>
            </div>
          </div>
          <div className="relative h-96 rounded-3xl overflow-hidden group cursor-pointer">
            <img
              src="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png"
              alt="Supercharging Offer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">NEW OWNERS</span>
              <h3 className="text-3xl font-bold text-white mb-2">Free Supercharging</h3>
              <p className="text-gray-200 mb-6">Get 3 months of free Supercharging when you take delivery by Dec 31.</p>
              <button className="bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                Order Now
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Tesla */}
      <section>
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Why Tesla?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Zap className="w-8 h-8 text-yellow-400" />, title: "Electric Future", desc: "Zero emissions, 100% electric. Join the transition to sustainable energy." },
            { icon: <Award className="w-8 h-8 text-purple-400" />, title: "Safety First", desc: "Designed from the ground up to be the safest vehicles on the road." },
            { icon: <Settings className="w-8 h-8 text-blue-400" />, title: "Autopilot", desc: "Advanced driver assistance systems to make driving safer and less stressful." }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-all text-center">
              <div className="bg-white/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Store Locator */}
      <section className="bg-white/5 rounded-3xl p-8 lg:p-12 border border-white/10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Find Us</h2>
            <p className="text-gray-400 mb-8">
              Visit a Tesla Gallery or Service Center near you. Experience our vehicles in person and speak with our advisors.
            </p>
            <div className="space-y-4">
              {['Mumbai - Bandra Kurla Complex', 'New Delhi - Select Citywalk', 'Bangalore - UB City', 'Pune - Phoenix Marketcity'].map((loc, i) => (
                <div key={i} className="flex items-center gap-4 text-white p-4 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors">
                  <MapPin className="text-red-500" />
                  <span>{loc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-96 bg-gray-800 rounded-2xl overflow-hidden relative">
            {/* Placeholder Map */}
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-xl">
                View Interactive Map
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
);

const ShopPage = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  return (
    <div className="min-h-screen bg-[#020617] pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-4 text-center">Tesla Shop</h1>
        <p className="text-gray-400 text-center mb-16">Accessories, apparel and lifestyle products.</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(SHOP_CATEGORIES).map(([key, cat]) => (
            <div
              key={key}
              onClick={() => setSelectedCategory(key)}
              className="group cursor-pointer relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white mb-2">{cat.name}</h3>
                <p className="text-purple-400 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                  Shop Now →
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Modal Placeholder */}
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl p-8 max-w-2xl w-full relative">
              <button
                onClick={() => setSelectedCategory(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-3xl font-bold text-white mb-6">{SHOP_CATEGORIES[selectedCategory].name}</h2>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="aspect-square bg-gray-800 rounded-lg mb-3"></div>
                    <div className="text-white font-medium">Premium Product {i}</div>
                    <div className="text-gray-400">$XXX.00</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Payment Page Component
const PaymentPage = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const data = sessionStorage.getItem('pendingOrder');
    if (data) setOrderData(JSON.parse(data));
    else onNavigate('home');
  }, []);

  const handlePayment = async (e) => {
    e.preventDefault();

    // Check if user is still logged in
    if (!user) {
      alert('❌ Please login to complete your purchase');
      onNavigate('login');
      return;
    }

    setLoading(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await orderAPI.createOrder({
      ...orderData,
      paymentDetails: { last4: '4242', brand: 'Visa' }
    });

    if (result.success) {
      sessionStorage.removeItem('pendingOrder');
      alert('✅ Payment Successful! Order Placed.');
      onNavigate('account');
    } else {
      // Show specific error message from backend
      const errorMsg = result.error || result.data?.message || 'Unable to process payment. Please try again.';
      console.error('Payment failed:', result);
      alert('❌ Payment Failed: ' + errorMsg);

      // If unauthorized, redirect to login
      if (result.status === 401) {
        alert('Your session has expired. Please login again.');
        onNavigate('login');
      }
    }
    setLoading(false);
  };

  if (!orderData) return null;

  return (
    <div className="min-h-screen pt-24 px-6 bg-gray-50 flex justify-center items-center">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="bg-white p-8 rounded-2xl shadow-lg h-fit">
          <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>{orderData.vehicleName}</span>
              <span>${orderData.totalPrice.toLocaleString()}</span>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Battery: {orderData.config.battery}</p>
              <p>Paint: {orderData.config.paint}</p>
              <p>Wheels: {orderData.config.wheels}</p>
              <p>Interior: {orderData.config.interior}</p>
            </div>
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between font-bold text-xl">
                <span>Total Due</span>
                <span>${orderData.totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-6">Payment Details</h2>
          <form onSubmit={handlePayment} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
              <input type="text" required className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
              <div className="relative">
                <input type="text" required maxLength="19" className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="0000 0000 0000 0000" />
                <CreditCard className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                <input type="text" required placeholder="MM/YY" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                <input type="text" required maxLength="3" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="123" />
              </div>
            </div>
            <button
              disabled={loading}
              className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Lock className="w-4 h-4" /> Pay ${orderData.totalPrice.toLocaleString()}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// SERVICING PAGE
// ==========================================
const ServicingPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    serviceDate: '',
    vehicleModel: '',
    vin: '',
    issueDescription: '',
    currentKm: '',
    serviceType: 'Regular Maintenance',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  const fetchMyBookings = async () => {
    try {
      const response = await fetchWithAuth('/servicing/my-requests');
      if (response.success) {
        setMyBookings(response.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to book a service');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchWithAuth('/servicing/request', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        alert('✅ Service request submitted successfully!');
        setFormData({
          serviceDate: '',
          vehicleModel: '',
          vin: '',
          issueDescription: '',
          currentKm: '',
          serviceType: 'Regular Maintenance',
          notes: ''
        });
        fetchMyBookings();
        trackEvent('service_booking_submit', {
          model: formData.vehicleModel,
          type: formData.serviceType
        });
      } else {
        alert('❌ ' + response.error);
      }
    } catch (error) {
      alert('Failed to submit service request');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-white">
            Servicing & Maintenance
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Keep your Tesla in peak condition with our comprehensive service solutions
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Service Booking Form */}
          <div className="backdrop-blur-xl bg-white/15 border border-white/30 shadow-[0_0_30px_rgba(148,163,255,0.3)] rounded-3xl p-10">
            <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
              <Settings className="w-8 h-8 text-purple-400" />
              Book Your Next Service
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Service Date *</label>
                <input
                  type="date"
                  required
                  value={formData.serviceDate}
                  onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Vehicle Model *</label>
                <select
                  required
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                >
                  <option value="">Select Model</option>
                  <option value="Model 3">Model 3</option>
                  <option value="Model Y">Model Y</option>
                  <option value="Model S">Model S</option>
                  <option value="Model X">Model X</option>
                  <option value="Cybertruck">Cybertruck</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">VIN (Optional)</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                  placeholder="5YJ3E1EA..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Service Type</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                >
                  <option value="Regular Maintenance">Regular Maintenance</option>
                  <option value="Repair">Repair</option>
                  <option value="Battery Service">Battery Service</option>
                  <option value="Software Update">Software Update</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Current Kilometers</label>
                <input
                  type="number"
                  value={formData.currentKm}
                  onChange={(e) => setFormData({ ...formData, currentKm: e.target.value })}
                  placeholder="50000"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Issue Description *</label>
                <textarea
                  required
                  rows="4"
                  value={formData.issueDescription}
                  onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                  placeholder="Describe the service needed..."
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                {submitting ? 'Submitting...' : 'Book Service'}
              </button>

              {!user && (
                <p className="text-center text-red-600 font-medium">Please login to book a service</p>
              )}
            </form>
          </div>

          {/* Service Information */}
          <div className="space-y-8">
            {/* Regular Maintenance */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 border border-purple-200 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Package className="w-7 h-7 text-purple-600" />
                Regular Maintenance
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base">Tire rotation and balancing every 10,000-12,000 km</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base">Brake fluid replacement every 4 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base">Air conditioning service every 2-4 years</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base">12V battery replacement as needed</span>
                </li>
              </ul>
            </div>

            {/* Warranty Details */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <Award className="w-7 h-7 text-green-600" />
                Warranty Coverage
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base"><strong>Basic Vehicle:</strong> 4 years or 80,000 km</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base"><strong>Battery & Drive Unit:</strong> 8 years or 192,000 km</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span className="text-base"><strong>Minimum 70%</strong> battery capacity retention</span>
                </li>
              </ul>
            </div>

            {/* Roadside Assistance */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-200 shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                <MapPin className="w-7 h-7 text-blue-600" />
                24/7 Roadside Assistance
              </h3>
              <p className="text-gray-700 text-base mb-4">
                Available 24/7 for the first 4 years or 80,000 km (whichever comes first).
              </p>
              <p className="text-blue-600 font-bold text-2xl">+91-8765432109</p>
            </div>
          </div>
        </div>

        {/* My Bookings */}
        {user && myBookings.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-purple-100">
            <h2 className="text-3xl font-bold mb-8">My Service Bookings</h2>
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <div key={booking._id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold">{booking.vehicleModel}</h3>
                      <p className="text-gray-600">{booking.serviceType}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{booking.issueDescription}</p>
                  <p className="text-sm text-gray-500">
                    Service Date: {new Date(booking.serviceDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// CONTACT US PAGE
// ==========================================
const ContactPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    model: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetchWithAuth('/contact/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        alert('✅ Message sent successfully! We will get back to you soon.');
        setFormData({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          model: '',
          message: ''
        });
      } else {
        alert('❌ ' + response.error);
      }
    } catch (error) {
      alert('Failed to send message');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-slate-900 relative overflow-hidden">
      {/* 3D Rotating Tesla - No Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ perspective: '2000px' }}>
        <img
          src="https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-S-Desktop-LHD.png"
          alt="Tesla 3D Model"
          className="w-[900px] h-auto opacity-15"
          style={{
            animation: 'rotate3d 40s linear infinite',
            transformStyle: 'preserve-3d'
          }}
        />
      </div>
      <style>{`
        @keyframes rotate3d {
          0% { transform: rotateY(0deg) rotateX(5deg); }
          25% { transform: rotateY(90deg) rotateX(5deg); }
          50% { transform: rotateY(180deg) rotateX(5deg); }
          75% { transform: rotateY(270deg) rotateX(5deg); }
          100% { transform: rotateY(360deg) rotateX(5deg); }
        }
      `}</style>
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="text-center mb-20">
            <h1 className="text-6xl font-bold mb-8 text-white">
              Contact Us
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              We're here to help! Reach out to us with any questions or concerns.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="backdrop-blur-xl bg-white/15 border border-white/30 shadow-[0_0_30px_rgba(148,163,255,0.3)] rounded-3xl p-12">
              <h2 className="text-3xl font-bold mb-10 flex items-center gap-3 text-white">
                <User className="w-8 h-8 text-purple-400" />
                Send a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block text-base font-semibold text-white mb-3">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg text-white placeholder-gray-400"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-white mb-3">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg text-white placeholder-gray-400"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-white mb-3">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg text-white placeholder-gray-400"
                    placeholder="+91-9876543210"
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-white mb-3">Interested Model</label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg text-white [&>option]:text-black"
                  >
                    <option value="">Select a Model</option>
                    <option value="Model S">Model S</option>
                    <option value="Model 3">Model 3</option>
                    <option value="Model X">Model X</option>
                    <option value="Model Y">Model Y</option>
                    <option value="Cybertruck">Cybertruck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-base font-semibold text-white mb-3">Message</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-4 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all text-lg text-white placeholder-gray-400 resize-none h-32"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-10">
              {/* Support Details */}
              <div className="backdrop-blur-xl bg-white/15 border border-white/30 shadow-[0_0_30px_rgba(148,163,255,0.3)] rounded-3xl p-12">
                <h3 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
                  <Globe className="w-8 h-8 text-purple-400" />
                  Get in Touch
                </h3>
                <div className="space-y-8 text-lg text-white">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">📞</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Customer Support Hotline</p>
                      <a href="tel:+919876543210" className="text-purple-600 font-bold text-2xl hover:underline">
                        +91-9876543210
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">✉️</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Email Support</p>
                      <a href="mailto:ssanushka23@gmail.com" className="text-blue-600 font-bold text-xl hover:underline">
                        ssanushka23@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">📍</span>
                    </div>
                    <div>
                      <p className="font-bold text-white">Visit Us</p>
                      <p className="text-gray-200">
                        PES University – Electronic City Campus<br />
                        Hosur Road, Near NICE Road,<br />
                        Bengaluru, Karnataka 560100<br />
                        India
                      </p>
                    </div>
                  </div>
                  <span className="text-white text-xl">📧</span>
                </div>
                <div>
                  <p className="font-bold text-white">Support Email</p>
                  <a href="mailto:ssanushka23@gmail.com" className="text-blue-600 font-bold text-xl hover:underline">
                    ssanushka23@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 mb-2">Address</p>
                  <p className="text-gray-700 leading-relaxed">
                    PES University — Electronic City Campus<br />
                    1 University Road, Hosur Road<br />
                    Bangalore, Karnataka, 560100<br />
                    India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-lg mt-10">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
              <Clock className="w-8 h-8 text-green-600" />
              Office Hours
            </h3>
            <div className="space-y-4 text-lg">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Weekdays</span>
                <span className="text-gray-700">9:00 AM - 6:00 PM IST</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Weekends</span>
                <span className="text-gray-700">10:00 AM - 4:00 PM IST</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl p-10 border border-gray-200 shadow-lg mt-10">
            <h3 className="text-3xl font-bold mb-6 text-gray-800">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-white border-2 border-blue-200 text-blue-700 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 hover:border-blue-400 transition-all duration-300">
                Schedule Test Drive
              </button>
              <button className="w-full bg-white border-2 border-purple-200 text-purple-700 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 hover:border-purple-400 transition-all duration-300">
                Book Service Appointment
              </button>
              <button className="w-full bg-white border-2 border-green-200 text-green-700 py-4 rounded-xl font-bold text-lg hover:bg-green-50 hover:border-green-400 transition-all duration-300">
                Customer Care Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DEMO DRIVE FEATURE PAGE
// ==========================================
const DemoDrivePage = ({ vehicleId, onBack }) => {
  const vehicle = VEHICLES[vehicleId];
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showKnowMore, setShowKnowMore] = useState(false);

  const modelInfo = {
    model3: {
      overview: 'Model 3 is designed for electric-powered performance, with dual motor AWD, quick acceleration, long range and fast charging.',
      highlights: [
        'Starting Price: $38,990',
        'Up to 341 miles of range',
        '3.1s 0-60 mph (Performance)',
        'Top Speed: 162 mph',
        'Autopilot included',
        'All-Wheel Drive available',
        'Premium interior and sound',
        '15.4" touchscreen display'
      ],
      safety: 'Model 3 has achieved the lowest probability of injury of any vehicle ever tested by NHTSA.',
      technology: 'Over-the-air software updates continually improve your vehicle, adding new features and capabilities.'
    },
    modelY: {
      overview: 'Model Y provides maximum versatility—able to carry 7 passengers and their cargo. Each second row seat folds flat independently.',
      highlights: [
        'Starting Price: $44,990',
        'Up to 330 miles of range',
        '3.5s 0-60 mph (Performance)',
        'Seating for up to 7',
        'Panoramic glass roof',
        'Largest cargo capacity',
        'All-Wheel Drive standard',
        'Heat pump for efficiency'
      ],
      safety: '5-star safety rating in every category. Built with a low center of gravity for rollover protection.',
      technology: 'Navigate on Autopilot actively guides your car from highway on-ramp to off-ramp.'
    },
    modelS: {
      overview: 'Model S Plaid has the quickest acceleration of any vehicle in production. Updated battery architecture enables both a 396 mile range and top speeds up to 200 mph.',
      highlights: [
        'Starting Price: $74,990',
        'Up to 405 miles of range',
        '1.99s 0-60 mph (Plaid)',
        'Top Speed: 200 mph',
        '1,020 horsepower (Plaid)',
        'Tri-motor All-Wheel Drive',
        'Yoke steering wheel',
        '17" cinematic display'
      ],
      safety: 'Rigid body structure and fortified battery pack provide superior occupant protection.',
      technology: '22-speaker, 960-watt audio system with Active Noise Cancellation provides studio-quality sound.'
    },
    modelX: {
      overview: 'Model X Plaid is the quickest, most capable sport utility vehicle ever. With room for up to seven, Model X Plaid delivers maximum utility.',
      highlights: [
        'Starting Price: $94,990',
        'Up to 348 miles of range',
        '2.5s 0-60 mph (Plaid)',
        'Seating for up to 7',
        'Falcon Wing doors',
        'Tri-motor AWD',
        '1,020 horsepower (Plaid)',
        'Bioweapon Defense Mode'
      ],
      safety: 'Extremely low rollover risk with the lowest center of gravity of any SUV.',
      technology: 'HEPA filtration system removes 99.97% of particulate exhaust pollution and allergens.'
    },
    cybertruck: {
      overview: 'Better utility than a truck with more performance than a sports car. Cybertruck is built with an exterior shell made for ultimate durability and passenger protection.',
      highlights: [
        'Starting Price: $60,990',
        'Up to 500+ miles of range',
        '2.6s 0-60 mph (Cyberbeast)',
        'Up to 14,000 lbs towing',
        'Exoskeleton design',
        'Armor Glass windows',
        '18.5" touchscreen',
        '6.5-foot vault bed'
      ],
      safety: 'Ultra-Hard 30X Cold-Rolled stainless-steel structural skin reduces dents, damage and long-term corrosion.',
      technology: 'Adaptive Air Suspension adjusts for a comfortable and controlled ride, no matter the terrain.'
    }
  };

  const currentInfo = modelInfo[vehicleId] || modelInfo.model3;

  const features = {
    model3: [
      { id: 1, name: 'Center Touchscreen', x: 50, y: 45, description: '15.4" cinematic display with tilt and left-right swivel for optimal viewing from any seat.' },
      { id: 2, name: 'Steering Controls', x: 25, y: 55, description: 'Scroll wheels for autopilot controls, media, voice commands, and turn signals.' },
      { id: 3, name: 'Premium Audio', x: 70, y: 30, description: 'Immersive sound system with 17 speakers and Active Road Noise Reduction.' },
      { id: 4, name: 'Glass Roof', x: 50, y: 15, description: 'All-glass roof provides more headroom and UV protection while maintaining comfort.' },
      { id: 5, name: 'Wireless Charging', x: 50, y: 75, description: 'Charge up to 2 smartphones simultaneously with 15W fast charging.' }
    ],
    modelY: [
      { id: 1, name: 'Center Display', x: 50, y: 45, description: '15" touchscreen for navigation, entertainment, and vehicle controls.' },
      { id: 2, name: 'Steering Wheel', x: 25, y: 55, description: 'Heated steering wheel with intuitive scroll buttons for autopilot and media.' },
      { id: 3, name: 'Panoramic Glass', x: 50, y: 15, description: 'Expansive glass roof creates a spacious, airy cabin feel.' },
      { id: 4, name: 'Premium Seats', x: 70, y: 60, description: 'Heated front and rear seats with vegan leather upholstery.' },
      { id: 5, name: 'Storage Space', x: 30, y: 70, description: 'Largest cargo capacity in its class with versatile storage options.' }
    ],
    modelS: [
      { id: 1, name: 'Cinematic Display', x: 50, y: 45, description: '17" cinematic touchscreen with left-right tilt and 2200 x 1300 resolution.' },
      { id: 2, name: 'Yoke Steering', x: 25, y: 55, description: 'Revolutionary yoke design with scroll wheels and haptic feedback.' },
      { id: 3, name: 'Rear Display', x: 65, y: 50, description: '8" touchscreen for rear passengers with entertainment and climate controls.' },
      { id: 4, name: 'Premium Audio', x: 70, y: 30, description: '22-speaker, 960-watt audio system with Active Road Noise Reduction.' },
      { id: 5, name: 'Tri-Zone Climate', x: 50, y: 75, description: 'Independent climate controls for driver, passenger, and rear.' }
    ],
    modelX: [
      { id: 1, name: 'Center Screen', x: 50, y: 45, description: '17" cinematic display with tilt and swivel for perfect viewing.' },
      { id: 2, name: 'Falcon Wing Doors', x: 80, y: 40, description: 'Iconic falcon wing rear doors with obstacle detection sensors.' },
      { id: 3, name: 'Yoke Steering', x: 25, y: 55, description: 'Innovative yoke steering with scroll controls and force feedback.' },
      { id: 4, name: 'HEPA Filter', x: 60, y: 70, description: 'Medical-grade HEPA filtration system removes 99.97% of particles.' },
      { id: 5, name: 'Six Seats', x: 70, y: 60, description: 'Spacious six-seat configuration with easy access to third row.' }
    ],
    cybertruck: [
      { id: 1, name: 'Center Display', x: 50, y: 45, description: '18.5" touchscreen with customizable interface and real-time stats.' },
      { id: 2, name: 'Yoke Steering', x: 25, y: 55, description: 'Futuristic squircle steering with integrated controls.' },
      { id: 3, name: 'Vault Access', x: 70, y: 30, description: 'Pass-through storage to 6.5-foot vault with powered tonneau cover.' },
      { id: 4, name: 'Ar Display HUD', x: 35, y: 25, description: 'Advanced instrument cluster with AR navigation overlay.' },
      { id: 5, name: 'Tactical Seating', x: 65, y: 60, description: 'Durable, easy-to-clean seating for 6 adults with fold-flat capability.' }
    ]
  };

  const currentFeatures = features[vehicleId] || features.model3;
  const interiorImage = STATIC_INTERIORS[vehicleId]?.[0] || vehicle.images.white?.interior || vehicle.image;

  return (
    <div className="min-h-screen bg-black relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-50 bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">{vehicle.name} Interior Experience</h1>
        <p className="text-gray-300 mb-4">Click on the markers to explore features</p>
        <button
          onClick={() => setShowKnowMore(true)}
          className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all shadow-xl"
        >
          KNOW MORE
        </button>
      </div>

      {/* Interior Image with Hotspots */}
      <div className="relative w-full h-screen">
        <img
          src={interiorImage}
          alt={`${vehicle.name} Interior`}
          className="w-full h-full object-cover"
        />

        {/* Feature Hotspots */}
        {currentFeatures.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setSelectedFeature(feature)}
            className="absolute group"
            style={{ left: `${feature.x}%`, top: `${feature.y}%` }}
          >
            {/* Animated Pulse Ring */}
            <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-75"></div>
            {/* Main Dot */}
            <div className="relative w-6 h-6 bg-purple-600 rounded-full border-4 border-white shadow-2xl hover:scale-125 transition-transform">
              <div className="absolute inset-0 bg-white rounded-full animate-pulse opacity-50"></div>
            </div>
            {/* Arrow Pointer */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white text-black px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap shadow-xl">
                {feature.name}
              </div>
              <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white mx-auto"></div>
            </div>
          </button>
        ))}
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setSelectedFeature(null)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-2xl border border-purple-500/30 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">{selectedFeature.name}</h2>
              <button onClick={() => setSelectedFeature(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">{selectedFeature.description}</p>
            <button
              onClick={() => setSelectedFeature(null)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-all"
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* KNOW MORE Modal */}
      {showKnowMore && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setShowKnowMore(false)}>
          <div className="bg-white rounded-3xl p-10 max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-4xl font-bold text-slate-900">{vehicle.name}</h2>

              <button onClick={() => setShowKnowMore(false)} className="text-gray-600 hover:text-black transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Overview */}
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Overview</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{currentInfo.overview}</p>
              </div>

              {/* Key Highlights */}
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-4">Key Highlights</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {currentInfo.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
                      <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-800 font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety */}
              <div className="bg-blue-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Lock className="w-7 h-7" />
                  Safety
                </h3>
                <p className="text-blue-800 text-lg leading-relaxed">{currentInfo.safety}</p>
              </div>

              {/* Technology */}
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-purple-900 mb-3 flex items-center gap-2">
                  <Zap className="w-7 h-7" />
                  Technology
                </h3>
                <p className="text-purple-800 text-lg leading-relaxed">{currentInfo.technology}</p>
              </div>

              {/* CTA */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowKnowMore(false)}
                  className="w-full bg-gradient-to-r from-slate-900 to-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all"
                >
                  Explore Features Above
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Book Test Drive CTA */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40">
        <button className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:bg-gray-200 transition-all shadow-2xl hover:scale-105">
          Book Your Test Drive
        </button>
      </div>
    </div>
  );
};

// ==========================================
// CUSTOMER CARE PAGE
// ==========================================
const CustomerCarePage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: 'General',
    subject: '',
    query: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [myQueries, setMyQueries] = useState([]);

  useEffect(() => {
    if (user) {
      fetchMyQueries();
    }
  }, [user]);

  const fetchMyQueries = async () => {
    try {
      const response = await fetchWithAuth('/customer-care/my-queries');
      if (response.success) {
        setMyQueries(response.data);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to submit a query');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetchWithAuth('/customer-care/query', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.success) {
        alert('✅ Query submitted successfully! Our team will respond soon.');
        setFormData({ category: 'General', subject: '', query: '' });
        fetchMyQueries();
      } else {
        alert('❌ ' + response.error);
      }
    } catch (error) {
      alert('Failed to submit query');
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Customer Care
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Have a question? We're here to help!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Query Form */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-purple-100">
            <h2 className="text-3xl font-bold mb-8">Ask a Query</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                >
                  <option value="Billing">Billing</option>
                  <option value="Servicing">Servicing</option>
                  <option value="Features">Features</option>
                  <option value="Test Drive">Test Drive</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of your query"
                  maxLength="200"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Your Query *</label>
                <textarea
                  required
                  rows="6"
                  value={formData.query}
                  onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                  placeholder="Describe your question or concern in detail..."
                  maxLength="2000"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-lg resize-none"
                />
                <p className="text-sm text-gray-500 mt-2">{formData.query.length}/2000 characters</p>
              </div>

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-5 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                {submitting ? 'Submitting...' : 'Submit Query'}
              </button>

              {!user && (
                <p className="text-center text-red-600 font-medium">Please login to submit a query</p>
              )}
            </form>
          </div>

          {/* FAQs */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 border border-purple-200">
              <h3 className="text-2xl font-bold mb-4">🔋 Common Questions</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-gray-800 mb-1">How long does delivery take?</p>
                  <p className="text-gray-600">Delivery typically takes 4-8 weeks depending on configuration.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800 mb-1">What's included in the warranty?</p>
                  <p className="text-gray-600">4-year basic, 8-year battery & drivetrain with 70% capacity retention.</p>
                </div>
                <div>
                  <p className="font-bold text-gray-800 mb-1">Can I customize my order?</p>
                  <p className="text-gray-600">Yes! Use our configurator to customize paint, wheels, interior, and autopilot.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* My Queries */}
        {user && myQueries.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-purple-100">
            <h2 className="text-3xl font-bold mb-8">My Queries</h2>
            <div className="space-y-4">
              {myQueries.map((query) => (
                <div key={query._id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                          {query.category}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${query.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                          query.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            query.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                          {query.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{query.subject}</h3>
                      <p className="text-gray-700 mb-3">{query.query}</p>
                      {query.response && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                          <p className="font-bold text-green-800 mb-1">Response:</p>
                          <p className="text-gray-700">{query.response}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Submitted: {new Date(query.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component

const TeslaApp = () => {
  const [page, setPage] = useState('home');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const handleSelect = (id) => {
    if (id.startsWith('demo-drive-')) {
      const vehicleId = id.replace('demo-drive-', '');
      setSelectedVehicle(vehicleId);
      setPage('demo-drive');
    } else {
      setSelectedVehicle(id);
      setPage('configurator');
    }
  };
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-white to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Tesla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <ScrollProgress />
      {page !== 'configurator' && <Navigation currentPage={page} onNavigate={setPage} />}

      <div className="transition-opacity duration-500 ease-in-out">
        {page === 'home' && <Homepage onSelectVehicle={handleSelect} />}
        {page === 'vehicles' && <VehiclesPage onSelect={handleSelect} />}
        {page === 'advisor' && <AdvisorPage onSelect={handleSelect} />}
        {page === 'servicing' && <ServicingPage />}
        {page === 'contact' && <ContactPage />}
        {page === 'customer-care' && <CustomerCarePage />}
        {page === 'charging' && <ChargingPage />}
        {page === 'discover' && <DiscoverPage />}
        {page === 'shop' && <ShopPage />}
        {page === 'payment' && <PaymentPage onNavigate={setPage} />}
        {page === 'configurator' && selectedVehicle && (
          <Configurator vehicleId={selectedVehicle} onBack={() => setPage('home')} onNavigate={setPage} />
        )}
        {page === 'demo-drive' && selectedVehicle && (
          <DemoDrivePage vehicleId={selectedVehicle} onBack={() => setPage('home')} />
        )}
        {page === 'login' && <Login onNavigate={setPage} />}
        {page === 'account' && <AccountPage onNavigate={setPage} />}
      </div>
    </div>
  );
};

// Root Component with Auth Provider
const App = () => (
  <AuthProvider>
    <TeslaApp />
  </AuthProvider>
);

export default App;