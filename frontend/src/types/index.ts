// src/types.ts
export interface Quote {
  id: number;
  kind: string;
  code: string;
  name: string;
  expires_at: {
    date: string;
    hour: string;
  };
  published_at: {
    date: string;
    hour: string;
  };
  category: string[];
  replies_count: number;
  items_count: number;
  confirmed_items_count: number;
  downloadable: {
    xml: boolean;
    txt: boolean;
  };
  canceled: null | boolean;
  private_suppliers_ids: any[];
  metadata: {
    extra_fields?: {
      name: string;
      value: string;
    }[];
  };
  external_id: number;
  origin: string;
  erp_id: string | null;
  upload_id: string | null;
  buyer_legacy_user_id: number;
  items_origin: any[];
  already_reused: boolean;
}

export interface ApiResponse {
  header: {
    total_pages: number;
    current_page: number;
    total_count: number;
    results_per_page: number;
  };
  quotes: Quote[];
}
