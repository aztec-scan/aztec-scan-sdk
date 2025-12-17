import dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, "../.env") });

// Interface for configuration
export interface Config {
  explorerApi: {
    url: string;
    apiKey: string;
  };
  defaults: {
    contractType: string;
    deploymentArtifactPath: string;
  };
  aztec: {
    nodeUrl: string;
  };
}
const aztecNodeUrl = "https://devnet.aztec-labs.com";
// Create and export the configuration
export const config: Config = {
  explorerApi: {
    url: process.env.EXPLORER_API_URL || "https://api.aztecscan.xyz/v1",
    apiKey: process.env.API_KEY || "temporary-api-key",
  },
  defaults: {
    contractType: process.env.DEFAULT_CONTRACT_TYPE || "Token",
    deploymentArtifactPath:process.env.DEFAULT_DEPLOYMENT_ARTIFACT_PATH|| "./artifacts/deploymentArtifact.json",
  },
  aztec: {
    nodeUrl: process.env.AZTEC_NODE_URL || "https://devnet.aztec-labs.com",
  }
};
