// api/axios.ts
import axios from "axios";

const API_BASE_URL = "http://192.168.1.64:1111";
//const API_BASE_URL = "http://192.168.1.7:8000";

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get tokens from localStorage
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

// Attach access token to each request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(error);
        }
        const res = await axios.post(`${API_BASE_URL}api/token/refresh/`, {
          refresh_token: refreshToken,
        });

        const { access_token } = res.data;
        localStorage.setItem("access_token", access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const loginUser = async (user_name: string, user_pass: string) => {
  const body = {
    user_name: user_name,
    user_pass: user_pass,
  };
  console.log(body);
  const res = await api.post("api/v1/users/login/", body);

  localStorage.setItem("access_token", res.data.access_token);
  localStorage.setItem("refresh_token", res.data.refresh_token);

  return res.data;
};

export const validateToken = async () => {
  try {
    const res = await api.get("api/v1/users/validate");
    return res.data; // { valid: true, user_id, user_name }
  } catch {
    return { valid: false };
  }
};

export default api;
