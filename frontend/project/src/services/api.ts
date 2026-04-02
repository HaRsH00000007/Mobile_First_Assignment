const API_BASE = "http://127.0.0.1:8000";

export interface HealthStatus {
  status: string;
  total_users: number;
  total_products: number;
  artifacts_loaded: boolean;
}

export interface User {
  userId: string;
}

export interface UsersResponse {
  total_users: number;
  users: string[];
}

export interface Product {
  product_id: string;
  product_name: string;
  score?: number;
  main_category?: string;
  category?: string;
  rating: number;
  discounted_price?: number;
  img_link?: string;
  product_link?: string;
  reason?: string;
  method?: string;
}

export interface RecommendationsResponse {
  user_id: string;
  total_recommendations: number;
  recommendations: Product[];
}

export interface SeenProductsResponse {
  user_id: string;
  seen_count: number;
  seen_products: Product[];
}

export const apiService = {
  async checkHealth(): Promise<HealthStatus> {
    const response = await fetch(`${API_BASE}/`);
    if (!response.ok) {
      throw new Error('Backend is offline');
    }
    return response.json();
  },

  async fetchUsers(limit = 100, offset = 0): Promise<UsersResponse> {
    const response = await fetch(`${API_BASE}/users?limit=${limit}&offset=${offset}`);
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  },

  async getRecommendations(
    userId: string,
    n = 5,
    lambdaMmr = 0.7
  ): Promise<RecommendationsResponse> {
    const response = await fetch(
      `${API_BASE}/recommendations/${userId}?n=${n}&lambda_mmr=${lambdaMmr}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch recommendations');
    }
    return response.json();
  },

  async getSeenProducts(userId: string): Promise<SeenProductsResponse> {
    const response = await fetch(`${API_BASE}/users/${userId}/seen`);
    if (!response.ok) {
      throw new Error('Failed to fetch seen products');
    }
    return response.json();
  },
};
