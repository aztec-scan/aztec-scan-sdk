/**
 * Deploy a Token contract to Aztec devnet and verify it on AztecScan.
 *
 * This is the end-to-end acceptance test for the SDK:
 *   1. Connect to Aztec node via EmbeddedWallet
 *   2. Deploy a Schnorr account (sponsored fees)
 *   3. Deploy a TokenContract
 *   4. Verify the contract artifact on AztecScan
 *   5. Verify the contract instance on AztecScan
 *
 * Usage:
 *   npm run deploy-and-verify::devnet
 *   # or with explicit env vars:
 *   AZTEC_NODE_URL=https://v4-devnet-2.aztec-labs.com/ npm run deploy-and-verify
 *
 * Environment variables (or .env file):
 *   AZTEC_NODE_URL    — Aztec node RPC endpoint
 *   EXPLORER_API_URL  — AztecScan API base URL
 *   API_KEY           — AztecScan API key
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import dotenv from "dotenv";

// Aztec v4 imports
import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { EmbeddedWallet } from "@aztec/wallets/embedded";
import { SponsoredFeePaymentMethod } from "@aztec/aztec.js/fee";
import { getContractInstanceFromInstantiationParams } from "@aztec/aztec.js/contracts";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { Fr } from "@aztec/aztec.js/fields";
import { SPONSORED_FPC_SALT } from "@aztec/constants";
import {
  SponsoredFPCContractArtifact,
} from "@aztec/noir-contracts.js/SponsoredFPC";
import { TokenContract } from "@aztec/noir-contracts.js/Token";

// SDK imports
import { AztecScanClient, fromContractInstance } from "../src/index.js";
import type { DeployerMetadata } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// ── Configuration ───────────────────────────────────────────────────

const AZTEC_NODE_URL =
  process.env.AZTEC_NODE_URL ?? "https://v4-devnet-2.aztec-labs.com/";

const DEPLOY_TIMEOUT = 1_200_000; // 20 minutes for devnet

// ── Helpers ─────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${msg}`);
}

/**
 * Sleep to allow the indexer to pick up the on-chain data before we hit the API.
 */
async function waitForIndexing(seconds: number = 15) {
  log(`Waiting ${seconds}s for indexer to catch up...`);
  await new Promise((r) => setTimeout(r, seconds * 1000));
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  log("=== Deploy-and-Verify: Start ===");
  log(`Aztec node: ${AZTEC_NODE_URL}`);

  // 1. Setup wallet (proverEnabled required for devnet tx proof validation)
  log("Setting up EmbeddedWallet...");
  const node = createAztecNodeClient(AZTEC_NODE_URL);
  const wallet = await EmbeddedWallet.create(node, {
    ephemeral: true,
    pxeConfig: { proverEnabled: true },
  });
  log("Wallet created (prover enabled)");

  // 2. Setup sponsored FPC for fee payment
  log("Setting up SponsoredFPC...");
  const sponsoredFPC = await getContractInstanceFromInstantiationParams(
    SponsoredFPCContractArtifact,
    { salt: new Fr(SPONSORED_FPC_SALT) },
  );
  await wallet.registerContract(sponsoredFPC, SponsoredFPCContractArtifact);
  const sponsoredPaymentMethod = new SponsoredFeePaymentMethod(
    sponsoredFPC.address,
  );
  log(`SponsoredFPC at: ${sponsoredFPC.address}`);

  // 3. Deploy a Schnorr account
  log("Deploying Schnorr account...");
  const secretKey = Fr.random();
  const salt = Fr.random();
  const schnorrAccount = await wallet.createSchnorrAccount(secretKey, salt);
  const accountAddress = schnorrAccount.address;
  log(`Schnorr account address: ${accountAddress}`);

  const deployAccountMethod = await schnorrAccount.getDeployMethod();
  await deployAccountMethod.send({
    from: AztecAddress.ZERO,
    fee: { paymentMethod: sponsoredPaymentMethod },
    wait: { timeout: DEPLOY_TIMEOUT, returnReceipt: true },
  });
  log("Account deployed");

  // 4. Deploy TokenContract
  log("Deploying TokenContract...");
  const tokenName = "AztecScanSDKTest";
  const tokenSymbol = "ASST";
  const tokenDecimals = 18;

  const { contract: tokenContract, instance } = await TokenContract.deploy(
    wallet,
    accountAddress,
    tokenName,
    tokenSymbol,
    tokenDecimals,
  ).send({
    from: accountAddress,
    fee: { paymentMethod: sponsoredPaymentMethod },
    wait: { timeout: DEPLOY_TIMEOUT, returnReceipt: true },
  });

  // Extract verification params using the SDK helper
  const { address: contractAddress, contractClassId, verifyInstanceArgs } =
    fromContractInstance(instance, {
      constructorArgs: [accountAddress, tokenName, tokenSymbol, tokenDecimals],
      artifactObj: undefined, // we'll set it below after loading the artifact
    });

  log(`Token deployed at: ${contractAddress}`);
  log(`Contract class ID: ${contractClassId}`);
  log(`Salt: ${verifyInstanceArgs.salt}`);
  log(`Deployer: ${verifyInstanceArgs.deployer}`);
  log(`Public keys string length: ${verifyInstanceArgs.publicKeysString.length}`);
  log(`Constructor args: ${JSON.stringify(verifyInstanceArgs.constructorArgs)}`);

  // 5. Wait for indexer, then verify artifact
  await waitForIndexing(15);

  log("=== Verifying artifact on AztecScan ===");
  const client = new AztecScanClient();

  // Load the artifact JSON from disk (same one that was deployed)
  const tokenArtifactPath = join(
    __dirname,
    "../node_modules/@aztec/noir-contracts.js/artifacts/token_contract-Token.json",
  );
  const tokenArtifact = JSON.parse(readFileSync(tokenArtifactPath, "utf8"));

  const artifactResult = await client.verifyArtifact(
    contractClassId,
    1, // version
    tokenArtifact,
  );
  log(
    `Artifact verification: ${artifactResult.status} ${artifactResult.statusText}`,
  );

  // 6. Verify instance deployment
  log("=== Verifying instance on AztecScan ===");

  const deployerMetadata: DeployerMetadata = {
    contractIdentifier: "TokenContract",
    details: "Token deployed by aztec-scan-sdk deploy-and-verify script",
    creatorName: "aztec-scan-sdk",
    creatorContact: "",
    appUrl: "",
    repoUrl: "https://github.com/aztec-scan/aztec-scan-sdk",
    aztecScanNotes: {
      name: "AztecScanSDK Test Token",
      origin: "aztec-scan-sdk",
      comment:
        "Test token deployed by the aztec-scan-sdk E2E acceptance test (deploy-and-verify script).",
    },
  };

  const instanceResult = await client.verifyInstance(
    contractAddress,
    {
      ...verifyInstanceArgs,
      artifactObj: tokenArtifact,
    },
    deployerMetadata,
  );
  log(
    `Instance verification: ${instanceResult.status} ${instanceResult.statusText}`,
  );

  // 7. Summary
  log("=== Summary ===");
  log(`Token contract address: ${contractAddress}`);
  log(`Contract class ID:      ${contractClassId}`);
  log(`Artifact verified:      ${artifactResult.ok ? "YES" : "NO"}`);
  log(`Instance verified:      ${instanceResult.ok ? "YES" : "NO"}`);
  log("=== Deploy-and-Verify: Done ===");

  if (!artifactResult.ok || !instanceResult.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
