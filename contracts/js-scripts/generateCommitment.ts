import { Barretenberg, Fr } from "@aztec/bb.js";
import { ethers } from "ethers";

export async function generateCommitment(): Promise<any> {
  const secret = Fr.random();
  const nullifier = Fr.random();
  //   const nullifier = Fr.fromString(
  //     "0x0d841eaab964a091ffa52f69b8a56f4ac44ba3fe9353d9fb05ee87587dd00d81"
  //   );
  //   const secret = Fr.fromString(
  //     "0x2c5bc835101c507db6dd2c754eb6a6d821ac8f36c475c578a7298b6965a0e0a3"
  //   );

  const barratenberg = await Barretenberg.new();
  const commitment = await barratenberg.poseidon2Hash([nullifier, secret]);

  const result = ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "bytes32", "bytes32"],
    [nullifier.toString(), secret.toString(), commitment.toString()]
  );

  return result;
}

(async () => {
  await generateCommitment()
    .then((result: any) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
})();
