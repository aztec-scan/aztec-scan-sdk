// Export all public APIs
export * from "./api-utils";
export * from "./deployment-utils";
export * from "./config";
export * from "./types";

// Version information
export const VERSION = "0.1.0";

/**
 * Initialize the SDK with custom configuration
 *
 * @param options Configuration options
 */
export const initialize = (options: { apiUrl?: string; apiKey?: string }) => {
  if (options.apiUrl) {
    process.env.EXPLORER_API_URL = options.apiUrl;
  }

  if (options.apiKey) {
    process.env.API_KEY = options.apiKey;
  }

  console.info("Aztec Scan SDK initialized");
};
