import { ContractArtifact } from "@aztec/aztec.js/abi";
import { AztecAddress } from "@aztec/aztec.js/addresses";
import { Fr } from "@aztec/aztec.js/fields";
import { PublicKeys } from "@aztec/aztec.js/keys";

export interface ContractDeployerMetadata {
  contractIdentifier: string;
  details: string;
  creatorName: string;
  creatorContact: string;
  appUrl: string;
  repoUrl: string;
  reviewedAt: string;
  contractType: null | string;
}

export interface VerifyInstanceArgs {
  publicKeysString: string;
  deployer: string;
  salt: string;
  constructorArgs: string[];
  artifactObj: ArtifactObject;
}

export interface ArtifactObject {
  // Contract artifact properties
  [key: string]: any;
}

// Add missing interfaces for API utilities
export interface ApiRequestOptions {
  urlStr: string;
  method: string;
  postData: string;
  loggingString: string;
}

export interface HttpResponse {
  statusCode: number | undefined;
  statusMessage: string | undefined;
  data: string;
}

// Keep any other existing interfaces/types


export interface DeploymentArtifact {
  // these are things you need to store at deployment
  address: AztecAddress,
  deployer: AztecAddress,
  constructorArgs: any[],
  salt: Fr,
  publicKeys: PublicKeys

  // these can technically be recovered from contractArtifact
  version: number,
  classId: Fr,

  // the contract artifact it self, just so you never lose it and can always verify it!
  contractArtifact: ContractArtifact,
}