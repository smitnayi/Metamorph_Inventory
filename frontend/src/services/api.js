// src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'https://metamorph-backend.onrender.com/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('mm_access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

async function fetchApi(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
    
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
    };

    try {
        const response = await fetch(url, { ...options, headers });
        
        if (response.status === 401) {
            // If they are failing to login, don't say session expired, let it fall through to pass the actual error message
            if (endpoint !== '/token/') {
                localStorage.removeItem('mm_access_token');
                // If they are on any page other than login, kick them to login
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                throw new Error('Session expired. Please log in again.');
            }
        }

        // Handle empty responses
        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
            // DRF validation errors look like {"username": ["A user with that username already exists."]}
            let errorMessage = 'API Error';
            if (data.detail) errorMessage = data.detail;
            else if (data.error) errorMessage = data.error;
            else if (data.message) errorMessage = data.message;
            else if (typeof data === 'object' && Object.keys(data).length > 0) {
                // Grab the first array string from field validation errors
                const firstKey = Object.keys(data)[0];
                if (Array.isArray(data[firstKey])) {
                    errorMessage = data[firstKey][0];
                } else if (typeof data[firstKey] === 'string') {
                    errorMessage = data[firstKey];
                }
            }
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export const api = {
    get: (endpoint) => fetchApi(endpoint),
    post: (endpoint, body) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint, body) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => fetchApi(endpoint, { method: 'DELETE' }),
    
    login: async (username, password) => {
        const data = await fetchApi('/token/', { 
            method: 'POST', 
            body: JSON.stringify({ username, password }) 
        });
        if (data.access) {
            localStorage.setItem('mm_access_token', data.access);
        }
        return data;
    },
    
    register: async (userData) => {
        return await fetchApi('/register/', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    logout: () => {
        localStorage.removeItem('mm_access_token');
    },

    getMe: () => fetchApi('/me/')
};
