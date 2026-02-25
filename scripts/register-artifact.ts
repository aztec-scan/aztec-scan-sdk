/**
 * Register (verify) a contract artifact on AztecScan.
 *
 * Usage:
 *   npm run register-artifact <contractClassId> [version]
 *
 * Environment variables (or .env file):
 *   EXPLORER_API_URL  — AztecScan API base URL
 *   API_KEY           — API key
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { AztecScanClient } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

// Load the Token contract artifact from the v4 package
const tokenArtifactPath = join(
  __dirname,
  "../node_modules/@aztec/noir-contracts.js/artifacts/token_contract-Token.json",
);
const tokenArtifact = JSON.parse(readFileSync(tokenArtifactPath, "utf8"));

// Parse CLI args
const args = process.argv.slice(2);
const contractClassId = args[0] ?? "";
const version = parseInt(args[1] ?? "1", 10);

if (!contractClassId) {
  console.error("Error: Contract class ID is required");
  console.error("Usage: npm run register-artifact <contractClassId> [version]");
  process.exit(1);
}

async function main() {
  console.log(
    `Registering Token artifact for class ${contractClassId}, version ${version}`,
  );

  const client = new AztecScanClient();
  const result = await client.verifyArtifact(
    contractClassId,
    version,
    tokenArtifact,
  );

  if (result.ok) {
    console.log(
      `Registration ${result.status === 201 ? "succeeded (newly verified)" : "succeeded (already verified)"}`,
    );
  } else {
    console.error(`Registration failed: ${result.status} ${result.statusText}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
