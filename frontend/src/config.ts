const cleanUrl = (url: string) => url.endsWith("/") ? url.slice(0, -1) : url;

export const API_BASE_URL = cleanUrl(
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
);
