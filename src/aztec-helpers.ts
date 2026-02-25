/**
 * Helpers for converting Aztec SDK types to AztecScan verification arguments.
 *
 * These eliminate the manual string extraction boilerplate when working with
 * contract instances returned by the Aztec SDK (e.g. from `TokenContract.deploy()`).
 */

import type { ContractInstanceWithAddress } from "@aztec/aztec.js/contracts";
import type { VerifyInstanceArgs } from "./types.js";

/**
 * Options for `fromContractInstance`.
 */
export interface FromContractInstanceOptions {
  /** Constructor arguments as they were passed to the deploy call. Values are stringified automatically. */
  constructorArgs?: unknown[];
  /** Optional artifact object to include for combined artifact+instance verification. */
  artifactObj?: Record<string, unknown>;
}

/**
 * Result of `fromContractInstance`, including both the verification args
 * and the extracted contract address and class ID.
 */
export interface FromContractInstanceResult {
  /** The contract instance address (stringified). Use as the first arg to `client.verifyInstance()`. */
  address: string;
  /** The contract class ID (stringified). Use as the first arg to `client.verifyArtifact()`. */
  contractClassId: string;
  /** The verification args to pass to `client.verifyInstance()`. */
  verifyInstanceArgs: VerifyInstanceArgs;
}

/**
 * Convert an Aztec SDK `ContractInstanceWithAddress` into the arguments needed
 * for AztecScan instance (and optionally artifact) verification.
 *
 * This extracts and stringifies `salt`, `deployer`, `publicKeysString`,
 * `constructorArgs`, and the contract `address` / `contractClassId`.
 *
 * @example
 * ```ts
 * const { contract, instance } = await TokenContract.deploy(wallet, admin, name, symbol, decimals)
 *   .send({ ... })
 *
 * const { address, contractClassId, verifyInstanceArgs } = fromContractInstance(instance, {
 *   constructorArgs: [admin, name, symbol, decimals],
 *   artifactObj: tokenArtifact,
 * });
 *
 * await client.verifyArtifact(contractClassId, 1, tokenArtifact);
 * await client.verifyInstance(address, verifyInstanceArgs, deployerMetadata);
 * ```
 */
export function fromContractInstance(
  instance: ContractInstanceWithAddress,
  options: FromContractInstanceOptions = {},
): FromContractInstanceResult {
  const { constructorArgs = [], artifactObj } = options;

  const salt = instance.salt.toString();
  const deployer = instance.deployer.toString();
  const publicKeysString = instance.publicKeys.toString();
  const address = instance.address.toString();
  const contractClassId = instance.currentContractClassId.toString();

  // Stringify all constructor args — the API expects string[]
  const stringifiedArgs = constructorArgs.map((arg) => {
    if (arg === null || arg === undefined) {
      return "";
    }
    // Objects with toString() (Fr, AztecAddress, etc.) are handled naturally
    return String(arg);
  });

  const verifyInstanceArgs: VerifyInstanceArgs = {
    publicKeysString,
    deployer,
    salt,
    constructorArgs: stringifiedArgs,
  };

  if (artifactObj) {
    verifyInstanceArgs.artifactObj = artifactObj;
  }

  return {
    address,
    contractClassId,
    verifyInstanceArgs,
  };
}
