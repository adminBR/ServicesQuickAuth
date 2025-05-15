// utils/auth.ts
import { validateToken } from "../api/axios";

export const isAuthenticated = async (): Promise<boolean> => {
  const res = await validateToken();
  return res.valid;
};
