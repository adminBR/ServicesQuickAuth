// apiService.ts
import axios from "axios";

const API_URL = "http://192.168.1.7:8000";
//const API_URL = 'http://192.168.15.111:8000';

// Create an Axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

// In your fetchVouchers function:
export const updateToken = async () => {
  try {
    const response = await api.post("/prod/auth", {
      refresh_token: localStorage.getItem("refresh_token"),
    });
    const accessToken = response.data.access_token;

    if (accessToken) {
      console.log(accessToken);
      return accessToken;
    } else {
      console.log("what");
    }
  } catch (error) {
    console.error(
      "Fetch vouchers error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// In your fetchVouchers function:
export const fetchVouchers = async (searchTerm: string) => {
  try {
    const response = await api.post("/prod/vouchers", {
      search_term: searchTerm,
      access_token: getAccessToken(),
    });
    return response.data.vouchers;
  } catch (error) {
    console.error(
      "Fetch vouchers error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export default api;
