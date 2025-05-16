import api from "./axios";

// Service request data interfaces
interface AddServiceRequest {
  srv_image: string;
  srv_name: string;
  srv_ip: string;
  srv_desc: string;
}

interface UpdateServiceRequest {
  srv_id: number;
  srv_image?: string;
  srv_name?: string;
  srv_ip?: string;
  srv_desc?: string;
}

/**
 * Fetch all services from the API
 * @returns Promise with service data
 */
export const getServices = async () => {
  const res = await api.get("api/v1/services/item/");
  return res.data;
};

/**
 * Add a new service
 * @param data Service data to add
 * @returns Promise with added service data
 */
export const addService = async (data: AddServiceRequest) => {
  // Transform data if needed to match API expectations
  const apiData = {
    srv_image: data.srv_image,
    srv_name: data.srv_name,
    srv_ip: data.srv_ip,
    srv_desc: data.srv_desc,
  };

  const res = await api.post("api/v1/services/item/", apiData);
  return res.data;
};

/**
 * Update an existing service
 * @param id ID of the service to update
 * @param data Updated service data
 * @returns Promise with updated service data
 */
export const updateService = async (
  id: number,
  data: Omit<UpdateServiceRequest, "srv_id">
) => {
  // Transform data to match API expectations
  const apiData = {
    srv_id: id,
    ...(data.srv_image && { srv_image: data.srv_image }),
    ...(data.srv_name && { srv_name: data.srv_name }),
    ...(data.srv_ip && { srv_ip: data.srv_ip }),
    ...(data.srv_desc && { srv_desc: data.srv_desc }),
  };

  const res = await api.put("api/v1/services/item/", apiData);
  return res.data;
};
