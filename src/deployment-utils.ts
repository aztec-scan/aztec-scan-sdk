import { ContractArtifact } from "@aztec/aztec.js/abi";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { ContractDeployer } from "@aztec/aztec.js/deployment";
import { Fr } from "@aztec/aztec.js/fields";
import { DeploymentArtifact } from "./types";
import { Wallet } from "@aztec/aztec.js/wallet";

export async function deployAndCreateDeploymentArtifact(wallet: Wallet, account: AztecAddress, artifact: ContractArtifact, constructorArgs: any[], salt?: Fr, constructorName = "constructor") {
    salt ??= Fr.random()
    const deployer = new ContractDeployer(artifact, wallet, undefined, constructorName);
    const deployedContract = await deployer.deploy(...constructorArgs).send({ contractAddressSalt: salt, from: account}).deployed();
    const deploymentArtifact: DeploymentArtifact = {
        address: deployedContract.address,
        deployer: account,
        constructorArgs: constructorArgs,
        salt: salt,
        publicKeys: deployedContract.instance.publicKeys,

        // these can technically be recovered from contractArtifact
        version: deployedContract.instance.version,
        classId: deployedContract.instance.currentContractClassId,

        // the contract artifact it self, just so you never lose it and can always verify it!
        contractArtifact: deployedContract.artifact,
    }
    return deploymentArtifact
}