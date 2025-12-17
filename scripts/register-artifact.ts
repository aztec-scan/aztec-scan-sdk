/* eslint-disable no-console */
import { readFileSync } from "fs";
import { join } from "path";
import {
  callExplorerApi,
  generateVerifyArtifactPayload,
  generateVerifyArtifactUrl,
} from "../src/api-utils";
import { config } from "../src/config";
import { ArtifactObject, DeploymentArtifact } from "../src/types";

const args = process.argv.slice(2);
const deploymentArtifactPath = args[0] || config.defaults.deploymentArtifactPath
// Load the token contract artifact directly from the known path
const deploymentArtifact = JSON.parse(readFileSync(deploymentArtifactPath,"utf8")) as DeploymentArtifact
const tokenContractArtifactJson = deploymentArtifact.contractArtifact


const contractClassId = deploymentArtifact.classId
const version = deploymentArtifact.version 

if (!contractClassId) {
  console.error("Error: Contract class ID is required");
  console.error("Usage: npm run register-artifact <contractClassId> [version]");
  process.exit(1);
}

const contractLoggingName = "Token Contract";

const registerContractClassArtifact = async (
  contractLoggingName: string,
  artifactObj: ArtifactObject,
  contractClassId: string,
  version: number,
): Promise<void> => {
  const url = generateVerifyArtifactUrl(
    config.explorerApi.url,
    contractClassId,
    version,
  );
  const payload = generateVerifyArtifactPayload(artifactObj);
  console.log(`Generated URL: ${url}`);
  console.log(`Payload structure: ${JSON.stringify(Object.keys(payload))}`);

  const postData = JSON.stringify(payload);

  await callExplorerApi({
    loggingString: `📜 registerContractClassArtifact ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
  });
};

// Main function
void (async (): Promise<void> => {
  console.log(
    `Registering ${contractLoggingName} with class ID: ${contractClassId}, version: ${version}`,
  );
  try {
    await registerContractClassArtifact(
      contractLoggingName,
      tokenContractArtifactJson as ArtifactObject,
      contractClassId.toString(),
      version,
    );
    console.log("Registration completed successfully!");
  } catch (error) {
    console.error("Error during registration:", error);
    process.exit(1);
  }
})();
