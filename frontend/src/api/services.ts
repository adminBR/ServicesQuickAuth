import api from "./axios";

export const getServices = async () => {
  const res = await api.get("/services");
  return res.data;
};

export const addService = async (data: {
  image: string;
  name: string;
  ip: string;
  desc: string;
}) => {
  const res = await api.post("/services", data);
  return res.data;
};

export const updateService = async (data: {
  id: number;
  image?: string;
  name?: string;
  ip?: string;
  desc?: string;
}) => {
  const res = await api.put("/services", data);
  return res.data;
};
