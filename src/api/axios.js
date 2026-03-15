import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Ensure this matches your FastAPI port
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`🛠️ [DEBUG API] ${config.method.toUpperCase()} ${config.url}`);
  return config;
});

export default api;