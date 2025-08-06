import { CompiledCircuit, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { merkleTree } from "./merkleTree";
import { circuit } from "../../contractData/circuits";

export const generateProof = async ({
  leaves,
  receipient,
  commitment,
  nullifierHash,
  nullifier,
  secret,
  setWithdrawErrMsg,
}: {
  leaves: string[];
  receipient: string;
  commitment: string;
  nullifierHash: string;
  nullifier: string;
  secret: string;
  setWithdrawErrMsg: React.Dispatch<React.SetStateAction<string>>;
}): Promise<{ proof: Uint8Array<ArrayBufferLike>; merkleRoot: string }> => {
  const noir = new Noir(circuit as CompiledCircuit);
  const honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });

  const tree = await merkleTree(leaves);
  const merkleProof = tree.proof(tree.getIndex(commitment.toString()));

  const inputs = {
    // public inputs
    root: merkleProof.root,
    nullifier_hash: nullifierHash,
    _receipient: receipient,
    // private inputs
    secret: secret,
    nullifier: nullifier,
    merkle_proofs: merkleProof.pathElements.map((el) => el.toString()),
    is_even: merkleProof.pathIndices.map((el) => el % 2 === 0),
  };
  const { witness } = await noir.execute(inputs);
  const { proof, publicInputs } = await honk.generateProof(witness);

  // verifying proof
  const isVerified = await honk.verifyProof({ proof, publicInputs });
  console.log("isVerified", isVerified);
  if (!isVerified) {
    setWithdrawErrMsg("Proof is not valid");
  }

  return { proof, merkleRoot: merkleProof.root };
};
