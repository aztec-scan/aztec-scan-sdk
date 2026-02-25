/**
 * SDK Configuration.
 *
 * The old config.ts had a race condition: it read `process.env` at module load
 * time, before dotenv could be called by the consumer. The fix is to make
 * configuration a plain object that can be created with `createConfig()` or
 * overridden via `AztecScanClient` constructor options — no side-effects at
 * import time.
 */

export interface AztecScanConfig {
  /** Base URL of the AztecScan Explorer API (without trailing slash or API key segment). */
  explorerApiUrl: string;
  /** API key (inserted into the URL path). */
  apiKey: string;
}

/** Well-known network presets. */
export const NETWORKS = {
  devnet: {
    explorerApiUrl: "https://api.devnet.aztecscan.xyz",
    apiKey: "temporary-api-key",
  },
  testnet: {
    explorerApiUrl: "https://api.testnet.aztecscan.xyz",
    apiKey: "temporary-api-key",
  },
  mainnet: {
    explorerApiUrl: "https://api.aztecscan.xyz",
    apiKey: "temporary-api-key",
  },
} as const satisfies Record<string, AztecScanConfig>;

export type NetworkName = keyof typeof NETWORKS;

/**
 * Create a config, resolving from (in priority order):
 * 1. Explicit overrides passed in
 * 2. Environment variables (EXPLORER_API_URL, API_KEY)
 * 3. Network preset (defaults to "devnet")
 */
export function createConfig(
  overrides?: Partial<AztecScanConfig> & { network?: NetworkName },
): AztecScanConfig {
  const network = overrides?.network ?? "devnet";
  const preset = NETWORKS[network];

  return {
    explorerApiUrl:
      overrides?.explorerApiUrl ??
      process.env.EXPLORER_API_URL ??
      preset.explorerApiUrl,
    apiKey:
      overrides?.apiKey ?? process.env.API_KEY ?? preset.apiKey,
  };
}
