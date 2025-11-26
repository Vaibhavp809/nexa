import axios from 'axios';

// Support dynamic API URL from window.NEXA_API_URL (for widget embedding)
const getBaseURL = () => {
    if (typeof window !== 'undefined' && window.NEXA_API_URL) {
        return window.NEXA_API_URL;
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
