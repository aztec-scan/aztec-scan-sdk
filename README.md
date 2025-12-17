# Aztec Scan SDK

This SDK provides utilities for interacting with the Aztec Scan API. Specifically for registering contract metadata. [Our full API documentation is available here](https://docs.aztecscan.xyz).

## Features

✅ - Register contract artifacts
✅ - Verify contract deployments
✅ - Deployer contact information
⚠️ - To be shown on [Aztec Scan's Ecosystem page](https://aztecscan.xyz/ecosystem) you'll need to have AztecScanNotes registered. [Currently this is done by creating a PR to this file.](https://github.com/aztec-scan/chicmoz/blob/main/services/explorer-api/src/constants.ts).

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd aztec-scan-sdk

# Install dependencies
npm install
```

## Configuration

The SDK uses environment variables for configuration. You can either:

1. Modify the `.env` file directly
2. Create a `.env.local` file to override the default values
3. Set environment variables in your system

Available configuration options:

| Variable                            | Description                         | Default                               |
| ---------------------               | -------------------------------     | ----------------------------          |
| EXPLORER_API_URL                    | Base URL for the Aztec Scan API     | https://api.devnet.aztecscan.xyz/v1   |
| API_KEY                             | API key for authorization           | temporary-api-key                     |
| DEFAULT_CONTRACT_TYPE               | Default contract type               | Token                                 |
| DEFAULT_DEPLOYMENT_ARTIFACT_PATH    | Which deployment artifact to verify | ./artifacts/deploymentArtifact.json   |
| AZTEC_NODE_URL                      | which url to use for deployments    | https://devnet.aztec-labs.com         |
## Usage

### Deployment info required
The scripts below consume a json file that contains everything needed to verify deployment. This file is called the deploymentArtifact which has this structure: 
```ts
export interface DeploymentArtifact {
  address: AztecAddress,
  deployer: AztecAddress,
  constructorArgs: any[],
  salt: Fr,
  publicKeys: PublicKeys

  version: number,
  classId: Fr,

  contractArtifact: ContractArtifact,
}
```

Note that things like salt are usually discarded in the normal aztec deployment ux!

To make sure all you have all information stored you can use `deployAndCreateDeploymentArtifact()` from [deployment-utils.ts](src/deployment-utils.ts).

You can look at [deployContract.ts](scripts/deployContract.ts) to see how to deploy with it.  

run this to deploy the default aztec token contract and store it's deploymentArtifact in the [artifacts](./artifacts/deploymentArtifact.json) folder.
```bash
npm run deploy-contract
```


### Register a Contract Artifact

This script registers a contract artifact (Token contract) with the Explorer API:

Parameters:

- `deploymentArtifact` (optional): All information needed to verify the contract

Example:

```bash
npm run register-artifact ./artifacts/deploymentArtifact.json
```

### Verify a Contract Deployment

This script verifies a deployed contract instance:

Parameters:

- `deploymentArtifact` (optional): All information needed to verify the contract

```bash
npm run verify-deployment ./artifacts/deploymentArtifact.json
```



## Using the SDK in Your Code

```typescript
import {
  generateVerifyArtifactUrl,
  generateVerifyArtifactPayload,
  generateVerifyInstanceUrl,
  generateVerifyInstancePayload,
  callExplorerApi,
  initialize,
} from "aztec-scan-sdk";

// Optional: Initialize with custom settings
initialize({
  apiUrl: "https://your-api-url.com",
  apiKey: "your-api-key",
});

// Register a contract artifact
const registerArtifact = async (contractClassId, version, artifactObj) => {
  const url = generateVerifyArtifactUrl(undefined, contractClassId, version);
  const payload = generateVerifyArtifactPayload(artifactObj);

  await callExplorerApi({
    urlStr: url,
    method: "POST",
    postData: JSON.stringify(payload),
    loggingString: "Register Artifact",
  });
};

// Verify a contract deployment
const verifyDeployment = async (
  contractInstanceAddress,
  verifyArgs,
  deployerMetadata,
) => {
  const url = generateVerifyInstanceUrl(undefined, contractInstanceAddress);
  const payload = {
    verifiedDeploymentArguments: generateVerifyInstancePayload(verifyArgs),
    deployerMetadata,
  };

  await callExplorerApi({
    urlStr: url,
    method: "POST",
    postData: JSON.stringify(payload),
    loggingString: "Verify Deployment",
  });
};
```

## Building the SDK

```bash
npm run build
```

This will generate the compiled JavaScript files in the `dist` directory.

## License

This project is licensed under the Apache-2.0 License.
