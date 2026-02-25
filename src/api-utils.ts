/**
 * API utilities for communicating with the AztecScan Explorer API.
 *
 * Changes from the old version:
 * - Uses native `fetch` instead of Node http/https (simpler, works in more runtimes)
 * - Accepts an `AztecScanConfig` rather than reading a global singleton
 * - Validates field lengths for instance verification (matching server-side checks)
 * - No emojis in log output — plain, parseable text
 */

import type { AztecScanConfig } from "./config.js";
import type {
  ApiResponse,
  VerifyArtifactPayload,
  VerifiedDeploymentArguments,
  VerifyInstanceArgs,
  VerifyInstancePayload,
  DeployerMetadata,
} from "./types.js";

// ── URL generators ──────────────────────────────────────────────────

/**
 * Build the URL for artifact verification.
 * POST /v1/{apiKey}/l2/contract-classes/{classId}/versions/{version}
 */
export function generateVerifyArtifactUrl(
  config: AztecScanConfig,
  contractClassId: string,
  version: number,
): string {
  return `${config.explorerApiUrl}/v1/${config.apiKey}/l2/contract-classes/${contractClassId}/versions/${version}`;
}

/**
 * Build the URL for instance deployment verification.
 * POST /v1/{apiKey}/l2/contract-instances/{address}
 */
export function generateVerifyInstanceUrl(
  config: AztecScanConfig,
  contractInstanceAddress: string,
): string {
  return `${config.explorerApiUrl}/v1/${config.apiKey}/l2/contract-instances/${contractInstanceAddress}`;
}

// ── Payload generators ──────────────────────────────────────────────

/**
 * Generate the payload for artifact verification.
 *
 * Handles both `{ default: artifact }` module-style and plain artifact objects,
 * matching the pattern in @chicmoz-pkg/contract-verification.
 */
export function generateVerifyArtifactPayload(
  artifactObj: Record<string, unknown>,
): VerifyArtifactPayload {
  const artifact =
    "default" in artifactObj && typeof artifactObj.default === "object"
      ? artifactObj.default
      : artifactObj;
  return {
    stringifiedArtifactJson: JSON.stringify(artifact),
  };
}

/**
 * Generate the `verifiedDeploymentArguments` for instance verification.
 *
 * Validates field lengths to fail fast before hitting the server.
 * Matches server-side validation exactly:
 *   - publicKeysString: 514 chars ("0x" + 4*128 hex chars)
 *   - deployer: 66 chars ("0x" + 64 hex chars)
 *   - salt: 66 chars ("0x" + 64 hex chars)
 */
export function generateVerifyInstancePayload(
  args: VerifyInstanceArgs,
): VerifiedDeploymentArguments {
  if (args.publicKeysString.length !== 514) {
    throw new Error(
      `Invalid publicKeysString length: expected 514, got ${args.publicKeysString.length}`,
    );
  }
  if (args.deployer.length !== 66) {
    throw new Error(
      `Invalid deployer length: expected 66, got ${args.deployer.length}`,
    );
  }
  if (args.salt.length !== 66) {
    throw new Error(
      `Invalid salt length: expected 66, got ${args.salt.length}`,
    );
  }

  const result: VerifiedDeploymentArguments = {
    salt: args.salt,
    deployer: args.deployer,
    publicKeysString: args.publicKeysString,
    constructorArgs: args.constructorArgs,
  };

  if (args.artifactObj) {
    const artifact =
      "default" in args.artifactObj &&
      typeof args.artifactObj.default === "object"
        ? args.artifactObj.default
        : args.artifactObj;
    result.stringifiedArtifactJson = JSON.stringify(artifact);
  }

  return result;
}

/**
 * Build the full instance verification payload including optional deployer metadata.
 */
export function buildVerifyInstanceBody(
  args: VerifyInstanceArgs,
  deployerMetadata?: DeployerMetadata,
): VerifyInstancePayload {
  const payload: VerifyInstancePayload = {
    verifiedDeploymentArguments: generateVerifyInstancePayload(args),
  };
  if (deployerMetadata) {
    payload.deployerMetadata = deployerMetadata;
  }
  return payload;
}

// ── HTTP caller ─────────────────────────────────────────────────────

export interface CallExplorerApiOptions {
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: string;
  label?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

/**
 * Make an HTTP request to the Explorer API using native fetch.
 */
export async function callExplorerApi<T = unknown>(
  options: CallExplorerApiOptions,
): Promise<ApiResponse<T>> {
  const { url, method, body, label = method, timeout = 30_000 } = options;

  const sizeBytes = body ? new TextEncoder().encode(body).length : 0;
  const sizeMB = (sizeBytes / 1_000_000).toFixed(2);
  console.info(
    `[aztec-scan-sdk] ${label} -> ${method} ${url} (${sizeMB} MB)`,
  );

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: body
        ? { "Content-Type": "application/json" }
        : undefined,
      body: body ?? undefined,
      signal: controller.signal,
    });

    let data: T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    if (response.ok) {
      console.info(
        `[aztec-scan-sdk] ${label} <- ${response.status} ${response.statusText}`,
      );
    } else {
      console.error(
        `[aztec-scan-sdk] ${label} <- ${response.status} ${response.statusText}`,
        typeof data === "string" ? data : JSON.stringify(data),
      );
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      data,
    };
  } finally {
    clearTimeout(timer);
  }
}
