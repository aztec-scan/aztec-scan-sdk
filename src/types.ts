/**
 * Types for the AztecScan SDK.
 *
 * These match the server-side Zod schemas in chicmoz explorer-api exactly.
 * See: chicmoz/services/explorer-api/src/svcs/http-server/routes/paths_and_validation.ts
 */

// ── Artifact verification ───────────────────────────────────────────

/** Payload for POST /l2/contract-classes/:classId/versions/:version */
export interface VerifyArtifactPayload {
  stringifiedArtifactJson: string;
}

// ── Instance verification ───────────────────────────────────────────

/**
 * The inner `verifiedDeploymentArguments` object.
 * Server validates: publicKeysString.length === 514, deployer.length === 66, salt.length === 66.
 */
export interface VerifiedDeploymentArguments {
  salt: string;
  deployer: string;
  publicKeysString: string;
  constructorArgs: string[];
  /** If the artifact hasn't been verified yet, include it here. Optional. */
  stringifiedArtifactJson?: string;
}

/** Optional deployer metadata attached to a verified instance. */
export interface DeployerMetadata {
  contractIdentifier: string;
  details: string;
  creatorName: string;
  creatorContact: string;
  appUrl: string;
  repoUrl: string;
  contractType?: string | null;
  /** AztecScan notes — accepted on non-production environments (devnet/testnet). */
  aztecScanNotes?: AztecScanNotes | null;
}

/** Metadata notes shown in the AztecScan explorer UI for a contract instance. */
export interface AztecScanNotes {
  /** Display name for the contract on AztecScan. */
  name: string;
  /** Who deployed / created this contract (org, project, etc). */
  origin: string;
  /** Free-form comment or description. */
  comment: string;
  /** Optional list of related L1 contract addresses with notes. */
  relatedL1ContractAddresses?: Array<{
    address: string;
    note: string;
  } | null> | null;
}

/** Full payload for POST /l2/contract-instances/:address */
export interface VerifyInstancePayload {
  verifiedDeploymentArguments: VerifiedDeploymentArguments;
  deployerMetadata?: DeployerMetadata;
}

// ── Helpers for payload generation inputs ───────────────────────────

/**
 * Input arguments for `generateVerifyInstancePayload`.
 * The `artifactObj` can be either the raw JSON or a module with a `.default` export.
 */
export interface VerifyInstanceArgs {
  publicKeysString: string;
  deployer: string;
  salt: string;
  constructorArgs: string[];
  artifactObj?: Record<string, unknown>;
}

// ── API response types ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
}
