const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include', // Essential for cookies
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        return { success: false, error: `Server Error: ${response.statusText}`, status: response.status };
    }

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message, status: response.status };
    }

    return { success: true, data };
  } catch (error) {
    console.error("API Error:", error);
    return { success: false, error: "Cannot connect to server. Is it running?", status: 0 };
  }
};

export const authAPI = {
  signup: (name, email, password) => request('/auth/signup', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  checkAuth: () => request('/auth/check', { method: 'GET' }),
};

export const configAPI = {
  saveConfig: (vehicleId, config) => request('/configurations', { method: 'POST', body: { vehicleId, config } }),
  getConfig: (vehicleId) => request(`/configurations/${vehicleId}`, { method: 'GET' }),
  getAllConfigs: () => request('/configurations', { method: 'GET' }),
};

export default authAPI;