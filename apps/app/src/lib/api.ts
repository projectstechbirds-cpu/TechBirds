import { ApiClient } from "@techbirds/sdk";

const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8002";

// `credentials: "include"` is the default in our client; this app uses
// HttpOnly auth cookies for everything.
export const api = new ApiClient({ baseUrl, credentials: "include" });
