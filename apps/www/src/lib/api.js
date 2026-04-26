import { createApiClient } from "@techbirds/sdk";
const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8002";
/** Singleton API client for the marketing site. Import this — never call fetch directly. */
export const api = createApiClient(baseUrl);
