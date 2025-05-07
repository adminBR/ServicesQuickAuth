// src/api/index.ts
import axios from "axios";
import { ItemSmall, Filters, Item } from "../types";

const api = axios.create({
  baseURL: "http://192.168.1.64:5011",
});
interface ItemsResponse {
  items: ItemSmall[];
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export const fetchItems = async (filters: Filters): Promise<ItemsResponse> => {
  const params = {
    name: filters.name,
    table_tags: filters.tableTag, // Send as array
    column_tags: filters.columnTag, // Send as array
    page: filters.page,
    page_size: filters.pageSize,
  };

  const res = await api.get<[ItemSmall[], number]>("/items/", {
    params,
    paramsSerializer: (params) => {
      return Object.entries(params)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map((v) => `${key}=${encodeURIComponent(v)}`)
              .join("&");
          }
          return `${key}=${encodeURIComponent(value)}`;
        })
        .join("&");
    },
  });

  return {
    items: res.data[0],
    total: res.data[1],
  };
};

export const fetchItem = async (id: string): Promise<Item> => {
  try {
    const { data } = await api.get<Item[]>(`/item/${id}`);
    return data[0];
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error
  }
};

export const fetchTags = async (
  category: string,
  search: string = ""
): Promise<string[]> => {
  try {
    const { data } = await api.get<string[]>(`/tags/${category}`, {
      params: { query: search },
    });
    return data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
};

