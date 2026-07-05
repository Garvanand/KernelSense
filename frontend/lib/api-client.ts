export class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "APIError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const apiClient = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Read the selected access level from localStorage (persisted by Zustand)
    let accessLevel = "guest";
    try {
      if (typeof window !== "undefined") {
        const storeStr = localStorage.getItem("kernelsense-access-level");
        if (storeStr) {
          const store = JSON.parse(storeStr);
          if (store.state && store.state.level) {
            accessLevel = store.state.level;
          }
        }
      }
    } catch (e) {
      console.warn("Failed to read access level from storage");
    }

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    // Intercept and attach the access level
    headers.set("X-Access-Level", accessLevel);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMsg = "An error occurred";
      try {
        const errorData = await response.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {}
      throw new APIError(response.status, errorMsg);
    }

    return response.json();
  },

  get<T>(endpoint: string, options: RequestInit = {}) {
    return this.fetch<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body: any, options: RequestInit = {}) {
    return this.fetch<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};
