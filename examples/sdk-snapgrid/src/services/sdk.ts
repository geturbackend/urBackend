import urBackend from "@urbackend/sdk";

export const sdk = urBackend({
  apiKey: import.meta.env.VITE_URBACKEND_PUBLISHABLE_KEY,
  baseUrl: import.meta.env.VITE_URBACKEND_URL,
});