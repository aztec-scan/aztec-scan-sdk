/**
 * Verify a contract instance deployment on AztecScan.
 *
 * Usage:
 *   npm run verify-deployment <contractInstanceAddress> <publicKeysString> <deployer> <salt> [constructorArg1] [constructorArg2] ...
 *
 * Environment variables (or .env file):
 *   EXPLORER_API_URL  — AztecScan API base URL
 *   API_KEY           — API key
 */

import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { AztecScanClient } from "../src/index.js";
import type { DeployerMetadata } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// Parse CLI args
const args = process.argv.slice(2);
const contractInstanceAddress = args[0] ?? "";
const publicKeysString = args[1] ?? "";
const deployer = args[2] ?? "";
const salt = args[3] ?? "";
const constructorArgs = args.slice(4);

if (!contractInstanceAddress || !publicKeysString || !deployer || !salt) {
  console.error(
    "Error: Required arguments: <address> <publicKeysString> <deployer> <salt> [constructorArgs...]",
  );
  console.error(
    "Usage: npm run verify-deployment <address> <publicKeysString> <deployer> <salt> [arg1] [arg2] ...",
  );
  process.exit(1);
}

// Optional deployer metadata (can be customized)
const deployerMetadata: DeployerMetadata = {
  contractIdentifier: "TokenContract",
  details: "Standard Token Contract deployed via aztec-scan-sdk",
  creatorName: "",
  creatorContact: "",
  appUrl: "",
  repoUrl: "https://github.com/aztec-scan/aztec-scan-sdk",
};

async function main() {
  console.log(`Verifying instance deployment at ${contractInstanceAddress}`);

  const client = new AztecScanClient();
  const result = await client.verifyInstance(
    contractInstanceAddress,
    {
      publicKeysString,
      deployer,
      salt,
      constructorArgs,
    },
    deployerMetadata,
  );

  if (result.ok) {
    console.log("Verification succeeded");
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.error(`Verification failed: ${result.status} ${result.statusText}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
