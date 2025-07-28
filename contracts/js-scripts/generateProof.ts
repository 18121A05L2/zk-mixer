import { Noir } from "@noir-lang/noir_js";
import { Barretenberg, Fr, UltraHonkBackend } from "@aztec/bb.js";
import { ethers } from "ethers";
import { merkleTree } from "./merkleTree";

import fs from "fs";
import path from "path";

const circuit = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../circuits/target/circuits.json"),
    "utf8"
  )
);

export async function generateProof() {
  const args = process.argv.slice(2);
  const nullifier = Fr.fromString(args[0]);
  const secret = Fr.fromString(args[1]);

  const barratenberg = await Barretenberg.new();
  const commitment = await barratenberg.poseidon2Hash([nullifier, secret]);

  const nullifierHash = await barratenberg.poseidon2Hash([nullifier]);

  const leaves = args.slice(3);
  const tree = await merkleTree(leaves);

  const merkleProof = tree.proof(tree.getIndex(commitment.toString()));

  try {
    const noir = new Noir(circuit);
    const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

    const inputs = {
      // public inputs
      root: merkleProof.root,
      nullifier_hash: nullifierHash.toString(),
      _receipient: args[2],
      // private inputs
      secret: secret.toString(),
      nullifier: nullifier.toString(),
      merkle_proofs: merkleProof.pathElements.map((el) => el.toString()),
      is_even: merkleProof.pathIndices.map((el) => el % 2 === 0),
    };

    const { witness } = await noir.execute(inputs);
    const originalLog = console.log; // Save original
    // Override to silence all logs
    console.log = () => {};
    const { proof, publicInputs } = await honk.generateProof(witness, {
      keccak: true,
    });
    console.log = originalLog;

    const result = ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes", "bytes32[]"],
      [proof, publicInputs]
    );
    return result;
  } catch (e) {
    console.log(e);
    throw new Error("failed to generate proof " + e);
  }
}

async () => {
  await generateProof()
    .then((result: any) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
};
