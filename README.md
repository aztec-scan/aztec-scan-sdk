# Aztec Scan SDK

SDK for verifying contract artifacts and deployments on [AztecScan](https://aztecscan.xyz). Compatible with Aztec v4 (`@aztec/*@4.0.0-devnet.2-patch.1`).

[Full API documentation](https://docs.aztecscan.xyz)

## Features

- Verify contract artifacts (contract classes)
- Verify contract instance deployments
- Attach deployer metadata (name, contact, repo, etc.)
- Attach AztecScan notes (displayed in the explorer UI)
- Network presets for devnet, testnet, mainnet
- Stateful `AztecScanClient` class or stateless utility functions
- End-to-end deploy-and-verify script for devnet

## Installation

```bash
git clone https://github.com/aztec-scan/aztec-scan-sdk.git
cd aztec-scan-sdk
npm install
```

## Configuration

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

| Variable           | Description                  | Default (devnet)                         |
| ------------------ | ---------------------------- | ---------------------------------------- |
| `EXPLORER_API_URL` | AztecScan API base URL       | `https://api.devnet.aztecscan.xyz`       |
| `API_KEY`          | API key                      | `temporary-api-key`                      |
| `AZTEC_NODE_URL`   | Aztec node RPC (for scripts) | `https://v4-devnet-2.aztec-labs.com/`    |

## Usage

### As a library

```typescript
import { AztecScanClient } from "aztec-scan-sdk";

// Uses env vars or defaults to devnet
const client = new AztecScanClient();

// Or configure explicitly
const client = new AztecScanClient({
  network: "testnet",
  // or: explorerApiUrl: "https://api.testnet.aztecscan.xyz",
  // apiKey: "your-api-key",
});

// Verify a contract artifact
const artifactResult = await client.verifyArtifact(
  contractClassId,
  1, // version
  artifactJson,
);

// Verify a contract instance deployment
const instanceResult = await client.verifyInstance(
  contractAddress,
  {
    publicKeysString,  // 514 chars: "0x" + 4*128 hex
    deployer,          // 66 chars: "0x" + 64 hex
    salt,              // 66 chars: "0x" + 64 hex
    constructorArgs: ["arg1", "arg2"],
    artifactObj: artifactJson, // optional if already verified
  },
  {
    // optional deployer metadata
    contractIdentifier: "MyToken",
    details: "My token contract",
    creatorName: "Alice",
    creatorContact: "alice@example.com",
    appUrl: "https://myapp.xyz",
    repoUrl: "https://github.com/alice/myapp",
    // optional AztecScan notes (shown in explorer UI, non-production envs only)
    aztecScanNotes: {
      name: "My Token",
      origin: "My Project",
      comment: "A brief description of this contract instance",
    },
  },
);
```

### CLI scripts

#### Register a contract artifact

```bash
npm run register-artifact <contractClassId> [version]
```

#### Verify a contract instance

```bash
npm run verify-deployment <address> <publicKeysString> <deployer> <salt> [constructorArgs...]
```

#### Deploy and verify (end-to-end, devnet)

Deploys a Token contract to devnet, then verifies both the artifact and instance on AztecScan:

```bash
npm run deploy-and-verify::devnet
```

This script:
1. Creates an ephemeral `EmbeddedWallet`
2. Deploys a Schnorr account (sponsored fees via `SponsoredFPC`)
3. Deploys a `TokenContract`
4. Waits for the indexer to pick up the deployment
5. Verifies the artifact on AztecScan
6. Verifies the instance deployment on AztecScan

## Field Reference

### `publicKeysString`

The `publicKeysString` is a 514-character hex string encoding the four master public keys of the contract instance. It is constructed by concatenating the keys in this exact order:

```
"0x" + masterNullifierPublicKey (128 hex chars)
     + masterIncomingViewingPublicKey (128 hex chars)
     + masterOutgoingViewingPublicKey (128 hex chars)
     + masterTaggingPublicKey (128 hex chars)
```

Total: `2 + 4*128 = 514 characters`.

If you have a deployed contract instance, the simplest way to get this value is:

```typescript
const publicKeysString = instance.publicKeys.toString();
```

This produces the correctly ordered string automatically. You do not need to construct it manually.

### `salt` and `deployer`

Both are 66-character hex strings (`"0x"` + 64 hex digits). After deploying a contract, extract them from the instance:

```typescript
const salt = instance.salt.toString();       // 66 chars
const deployer = instance.deployer.toString(); // 66 chars
```

Note that `salt` is generated randomly during deployment by default and is **not recoverable** after the fact unless you save it. The `deploy-and-verify.ts` script demonstrates how to capture all required values at deploy time.

## Building

```bash
npm run build          # Build SDK (src/ -> dist/)
npm run build:scripts  # Build scripts
npm run build:all      # Build both
```

## Architecture

```
src/
  config.ts     — Configuration (network presets, env var resolution)
  types.ts      — TypeScript types matching explorer-api Zod schemas
  api-utils.ts  — URL/payload generators + fetch-based HTTP client
  index.ts      — AztecScanClient class + re-exports

scripts/
  register-artifact.ts   — CLI: verify an artifact
  verify-deployment.ts   — CLI: verify an instance
  deploy-and-verify.ts   — E2E: deploy to devnet + verify on AztecScan
```

## License

Apache-2.0
