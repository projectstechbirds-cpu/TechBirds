import { createApiClient } from "@techbirds/sdk";

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8002";

export const api = createApiClient(baseUrl);
