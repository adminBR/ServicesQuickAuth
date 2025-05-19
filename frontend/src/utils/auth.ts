// utils/auth.ts
import { validateToken } from "../api/axios";

export const isAuthenticated = async (): Promise<boolean> => {
  const accessToken = localStorage.getItem("access_token");
  if (accessToken) {
    const res = await validateToken();
    return res;
  } else {
    return false;
  }
};
