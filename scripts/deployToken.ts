import { config } from "../src/config";
import { deployAndCreateDeploymentArtifact } from "../src/deployment-utils"

import { writeFileSync } from "fs";

import { createAztecNodeClient } from "@aztec/aztec.js/node";
import { TestWallet } from "@aztec/test-wallet/server";
import { getInitialTestAccountsData } from "@aztec/accounts/testing";
import { TokenContract } from "@aztec/noir-contracts.js/Token";
import { AztecAddress } from "@aztec/aztec.js/addresses";

async function main() {
    const node = createAztecNodeClient(config.aztec.nodeUrl);
    // Create a wallet and import test accounts
    const wallet = await TestWallet.create(node);
    const [alice] = await getInitialTestAccountsData();
    await wallet.createSchnorrAccount(alice.secret, alice.salt);

    const constructorArgs: [AztecAddress, string, string, number] = [
        alice.address,
        "TokenName", // Name of your token
        "TKN",       // Symbol
        18           // Decimals
    ]
    const deploymentArtifact = await deployAndCreateDeploymentArtifact(wallet, alice.address, TokenContract.artifact, constructorArgs)
    writeFileSync(config.defaults.deploymentArtifactPath, JSON.stringify(deploymentArtifact, null, 2))
}

main()