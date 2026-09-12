// Sasrika Real Estate - Centralized API Configuration
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5143/api'
).replace(/\/+$/, '');

export const API_ENDPOINTS = {
  properties: `${API_BASE_URL}/properties`,
  auth: `${API_BASE_URL}/auth`,
  admin: `${API_BASE_URL}/admin`,
  upload: `${API_BASE_URL}/upload/images`,
};

export default API_BASE_URL;
