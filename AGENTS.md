# AGENTS.md — Guide for AI Coding Agents

This repository is the **AztecScan SDK** — a TypeScript library and set of scripts for verifying contract artifacts and deployments on [AztecScan](https://aztecscan.xyz), the block explorer for the Aztec network.

## Project Structure

```
src/
  config.ts       — Config types, network presets (devnet/testnet/mainnet), createConfig()
  types.ts        — TypeScript types matching the explorer-api Zod schemas exactly
  api-utils.ts    — URL/payload generators + fetch-based HTTP client
  index.ts        — AztecScanClient class (main entry point) + re-exports

scripts/
  register-artifact.ts   — CLI script to verify a contract artifact
  verify-deployment.ts   — CLI script to verify a contract instance deployment
  deploy-and-verify.ts   — E2E script: deploy Token to devnet, then verify on AztecScan
```

## Setup

- **Node.js v22+** (native `fetch` required)
- `npm install` to install dependencies
- Copy `.env.example` to `.env` for local configuration

## Build

```bash
npm run build            # Build SDK core (src/ -> dist/)
npm run build:scripts    # Build scripts
npm run build:all        # Both
```

This is an **ESM project** (`"type": "module"` in package.json). All internal imports use `.js` extensions.

## Aztec Version

All `@aztec/*` packages are pinned to **`4.0.0-devnet.2-patch.1`**. Do not use `^` for Aztec packages — they have breaking changes between pre-releases.

## Key Concepts

### AztecScan Verification API

AztecScan has two verification endpoints:

1. **Artifact verification** — POST `/v1/{apiKey}/l2/contract-classes/{classId}/versions/{version}`
   - Body: `{ stringifiedArtifactJson: string }`
   - Server parses the artifact, derives `packedBytecode`, compares byte-for-byte against what's on-chain
   - Returns 200 (already verified) or 201 (newly verified)

2. **Instance verification** — POST `/v1/{apiKey}/l2/contract-instances/{address}`
   - Body: `{ verifiedDeploymentArguments: { salt, deployer, publicKeysString, constructorArgs, stringifiedArtifactJson? }, deployerMetadata?: { ... } }`
   - Server recomputes the contract address from the provided parameters and compares against the on-chain address
   - Field lengths: `publicKeysString` = 514 chars, `deployer` = 66 chars, `salt` = 66 chars

### Config Resolution

The `AztecScanClient` resolves config in priority order:
1. Explicit constructor options
2. Environment variables (`EXPLORER_API_URL`, `API_KEY`)
3. Network preset (defaults to `"devnet"`)

### Key Design Decisions

- **No side effects at import time.** The old SDK had a race condition where `dotenv.config()` ran at module load. The new SDK uses `createConfig()` as a factory function.
- **`fetch` over Node `http`/`https`.** Simpler, works in more runtimes.
- **Client-side validation.** Field lengths are validated before hitting the server, matching the server-side Zod schema checks.
- **Handles `{ default: artifact }` module imports.** Aztec artifact modules sometimes export `{ default: NoirCompiledContract }`. The SDK unwraps this transparently.

## Running Scripts

```bash
# Register (verify) an artifact
npm run register-artifact <contractClassId> [version]

# Verify an instance deployment
npm run verify-deployment <address> <publicKeysString> <deployer> <salt> [constructorArgs...]

# Deploy Token to devnet + verify on AztecScan (E2E acceptance test)
npm run deploy-and-verify::devnet
```

The deploy-and-verify script uses:
- `EmbeddedWallet` (ephemeral) with `proverEnabled: true` — required for devnet/testnet (fake proofs are rejected)
- `SponsoredFPC` + `SponsoredFeePaymentMethod` for fee payment
- `from: AztecAddress.ZERO` for account deployment (NOT the account's own address)
- `TokenContract.deploy()` for contract deployment
- 20-minute timeout for devnet block confirmation
- 15-second wait for the AztecScan indexer after deployment

**Important proving notes:**
- `EmbeddedWallet` defaults to `proverEnabled: false`, which generates fake `ChonkProof.random()` proofs. Devnet/testnet nodes reject these with "Invalid tx: Invalid proof".
- With `proverEnabled: true`, ClientIVC proof generation takes ~20s per tx via Barretenberg WASM.
- Account deploy must use `from: AztecAddress.ZERO`, not the account being deployed (the account's entrypoint can't run before its constructor).

### AztecScanNotes

AztecScanNotes are optional metadata attached to contract instances, displayed in the AztecScan explorer UI. They are passed as part of `deployerMetadata` in the instance verification request:

```typescript
{
  deployerMetadata: {
    aztecScanNotes: {
      name: "My Token",
      origin: "https://github.com/my-org/my-token",
      comment: "Deployed via CI pipeline",
      relatedL1ContractAddresses: [
        { address: "0x...", note: "L1 portal contract" }
      ]
    }
  }
}
```

**Known limitation (as of Feb 2026):** The explorer-api server strips `aztecScanNotes` when `NODE_ENV=production`. The SDK sends them correctly, but they are silently discarded on devnet/testnet until the server-side guard is updated.

## Code Style

- TypeScript strict mode
- ESM with `.js` import extensions
- No default exports
- No emojis in library output (scripts may log freely)
- `console.info` / `console.error` for logging (no external logger dependency)

## Environment Variables

| Variable           | Description                          | Default                                  |
| ------------------ | ------------------------------------ | ---------------------------------------- |
| `EXPLORER_API_URL` | AztecScan API base URL               | `https://api.devnet.aztecscan.xyz`       |
| `API_KEY`          | API key (path segment, not header)   | `temporary-api-key`                      |
| `AZTEC_NODE_URL`   | Aztec node RPC (deploy script only)  | `https://v4-devnet-2.aztec-labs.com/`    |

## Reference

- AztecScan API docs: https://docs.aztecscan.xyz
- Aztec v4 SDK: https://docs.aztec.network
- Server-side verification logic lives in the [chicmoz](https://github.com/aztec-scan/chicmoz) repo under `services/explorer-api/` and `packages/contract-verification/`
