/* eslint-disable no-console */
import { readFileSync } from "fs";
import { join } from "path";
import { 
  callExplorerApi, 
  generateVerifyInstanceUrl, 
  generateVerifyInstancePayload 
} from "../src/api-utils";
import { config } from "../src/config";
import { 
  ArtifactObject, 
  VerifyInstanceArgs, 
  ContractDeployerMetadata, 
  DeploymentArtifact
} from "../src/types";

// Load the token contract artifact directly from the known path
const deploymentArtifact = JSON.parse(readFileSync(config.defaults.deploymentArtifactPath,"utf8")) as DeploymentArtifact

const tokenContractArtifactJson = deploymentArtifact.contractArtifact
const contractInstanceAddress = deploymentArtifact.address
const contractLoggingName = "Token Contract";

// Example constructor arguments for a Token contract (must be strings)
const EXAMPLE_CONSTRUCTOR_ARGS = deploymentArtifact.constructorArgs

// TODO find out what the actual order is and do that. Instead of this long one liner that assumes the key order is correct (likely not!!!)
const EXAMPLE_PUBLIC_KEYS_STRING = "0x" + Object.keys(deploymentArtifact.publicKeys).map((k:string)=>(deploymentArtifact.publicKeys)[k as keyof typeof deploymentArtifact.publicKeys].toString().slice(2)).join("");
// Example deployer address
const EXAMPLE_DEPLOYER = deploymentArtifact.deployer;

// Example salt value
const EXAMPLE_SALT = deploymentArtifact.salt

// Example deployer metadata
const EXAMPLE_DEPLOYER_METADATA: ContractDeployerMetadata = {
  contractIdentifier: "TokenContract",
  details: "Standard Token Contract",
  creatorName: "Obsidion",
  creatorContact: "TBD",
  appUrl: "https://obsidion.xyz",
  repoUrl: "https://github.com/obsidionlabs",
  reviewedAt: new Date().toISOString(),
  contractType: null,
};

const verifyContractInstanceDeployment = async (
  contractLoggingName: string,
  contractInstanceAddress: string,
  verifyArgs: VerifyInstanceArgs,
  deployerMetadata: ContractDeployerMetadata,
): Promise<void> => {
  const url = generateVerifyInstanceUrl(
    config.explorerApi.url,
    contractInstanceAddress,
  );

  // Use generateVerifyInstancePayload to create verifiedDeploymentArguments
  const payload = {
    deployerMetadata,
    verifiedDeploymentArguments: generateVerifyInstancePayload(verifyArgs),
  };

  console.log(`Generated URL: ${url}`);
  console.log(`Payload structure: ${JSON.stringify(Object.keys(payload))}`);
  console.log(
    `Constructor args: ${JSON.stringify(verifyArgs.constructorArgs)}`,
  );
  console.log(`Deployer metadata: ${JSON.stringify(deployerMetadata)}`);

  const postData = JSON.stringify(payload);

  await callExplorerApi({
    loggingString: `🧐 verifyContractInstanceDeployment ${contractLoggingName}`,
    urlStr: url,
    postData,
    method: "POST",
  });
};

// Main function
void (async (): Promise<void> => {
  console.log(
    `Verifying deployment for contract instance address: ${contractInstanceAddress}`,
  );

  try {
    // Using hardcoded example values with the correct parameter structure
    const verifyArgs: VerifyInstanceArgs = {
      publicKeysString: EXAMPLE_PUBLIC_KEYS_STRING,
      deployer: EXAMPLE_DEPLOYER.toString(),
      salt: EXAMPLE_SALT.toString(),
      constructorArgs: EXAMPLE_CONSTRUCTOR_ARGS,
      artifactObj: tokenContractArtifactJson as ArtifactObject,
    };

    await verifyContractInstanceDeployment(
      contractLoggingName,
      contractInstanceAddress.toString(),
      verifyArgs,
      EXAMPLE_DEPLOYER_METADATA
    );

    console.log("Verification completed successfully!");
  } catch (error) {
    console.error("Error during verification:", error);
    process.exit(1);
  }
})();
