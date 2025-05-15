// api/axios.ts
import axios from "axios";

const API_BASE_URL = "http://192.168.1.7:8000"; // Change to your backend URL

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "multipart/form-data",
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
        const res = await axios.post(`${API_BASE_URL}/refresh`, {
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

export const registerUser = async (user_name: string, user_pass: string) => {
  const res = await api.post("/register", { user_name, user_pass });
  return res.data;
};

export const loginUser = async (user_name: string, user_pass: string) => {
  const formdata = new FormData();
  formdata.append("user_name", user_name);
  formdata.append("user_pass", user_pass);
  const res = await api.post("api/v1/users/login/", formdata);

  localStorage.setItem("access_token", res.data.access_token);
  localStorage.setItem("refresh_token", res.data.refresh_token);

  return res.data;
};

export const validateToken = async () => {
  try {
    const res = await api.get("api/v1/users/validate");
    return res.data; // { valid: true, user_id, user_name }
  } catch (err) {
    return { valid: false };
  }
};

export default api;
