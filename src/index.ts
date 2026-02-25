/**
 * AztecScan SDK — main entry point.
 *
 * Provides both:
 * 1. A stateful `AztecScanClient` class (recommended for most use-cases)
 * 2. Re-exported stateless utility functions for advanced/custom usage
 */

import { createConfig, type AztecScanConfig, type NetworkName } from "./config.js";
import {
  callExplorerApi,
  generateVerifyArtifactUrl,
  generateVerifyArtifactPayload,
  generateVerifyInstanceUrl,
  generateVerifyInstancePayload,
  buildVerifyInstanceBody,
} from "./api-utils.js";
import type {
  ApiResponse,
  DeployerMetadata,
  VerifyInstanceArgs,
} from "./types.js";

// ── Re-exports ──────────────────────────────────────────────────────

export * from "./config.js";
export * from "./types.js";
export {
  callExplorerApi,
  generateVerifyArtifactUrl,
  generateVerifyArtifactPayload,
  generateVerifyInstanceUrl,
  generateVerifyInstancePayload,
  buildVerifyInstanceBody,
} from "./api-utils.js";
export {
  fromContractInstance,
  type FromContractInstanceOptions,
  type FromContractInstanceResult,
} from "./aztec-helpers.js";

// ── Client class ────────────────────────────────────────────────────

export interface AztecScanClientOptions {
  /** Explicit API URL (takes precedence over network preset and env vars). */
  explorerApiUrl?: string;
  /** API key. */
  apiKey?: string;
  /** Network preset name. Defaults to "devnet". */
  network?: NetworkName;
  /** HTTP request timeout in ms (default: 30_000). */
  timeout?: number;
}

export class AztecScanClient {
  readonly config: AztecScanConfig;
  private readonly timeout: number;

  constructor(options?: AztecScanClientOptions) {
    this.config = createConfig(options);
    this.timeout = options?.timeout ?? 30_000;
  }

  /**
   * Verify a contract artifact (contract class).
   *
   * @returns API response. Status 200 = already verified, 201 = newly verified.
   */
  async verifyArtifact(
    contractClassId: string,
    version: number,
    artifactObj: Record<string, unknown>,
  ): Promise<ApiResponse> {
    const url = generateVerifyArtifactUrl(this.config, contractClassId, version);
    const payload = generateVerifyArtifactPayload(artifactObj);
    return callExplorerApi({
      url,
      method: "POST",
      body: JSON.stringify(payload),
      label: `verifyArtifact(${contractClassId}, v${version})`,
      timeout: this.timeout,
    });
  }

  /**
   * Verify a contract instance deployment.
   *
   * @returns API response. Status 200 = verified with complete instance data.
   */
  async verifyInstance(
    contractInstanceAddress: string,
    args: VerifyInstanceArgs,
    deployerMetadata?: DeployerMetadata,
  ): Promise<ApiResponse> {
    const url = generateVerifyInstanceUrl(this.config, contractInstanceAddress);
    const payload = buildVerifyInstanceBody(args, deployerMetadata);
    return callExplorerApi({
      url,
      method: "POST",
      body: JSON.stringify(payload),
      label: `verifyInstance(${contractInstanceAddress})`,
      timeout: this.timeout,
    });
  }
}

// ── Version ─────────────────────────────────────────────────────────

export const VERSION = "0.2.0";
