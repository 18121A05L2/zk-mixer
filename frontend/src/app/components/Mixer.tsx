import axios from "axios";
import { useState } from "react";
import {
  useAccount,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  ETH_DENOMINATION,
  SEPOLIA_EXPLORER,
  ZK_MIXER_CONTRACT,
} from "../utils/contants";
import Link from "next/link";
import { abi } from "../../contractData/abi";
import { generateProof } from "../utils/generateProof";

// import { randomBytes32 } from "../utils";
// import { bytesToHex } from "viem";
// import { Barretenberg } from "@aztec/bb.js";
// import { Fr } from "@aztec/bb.js";

export default function Mixer() {
  const [encodedProof, setEncodedProof] = useState<string>();
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const { writeContract, isPending, error, data } = useWriteContract();
  const { chainId, address } = useAccount();
  const {
    isLoading: isConfirmaing,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: data,
  });

  async function handleDeposit() {
    // const nullifier = bytesToHex(randomBytes32());
    // const secret = bytesToHex(randomBytes32());
    // const barratenberg = await Barretenberg.new({ threads: 1 });
    // const commitment = await barratenberg.poseidon2Hash([
    //   Fr.fromString(nullifier),
    //   Fr.fromString(secret),
    // ]);
    // console.log({ nullifier, secret, commitment });

    // TODO : need to move this to frontend
    const response = await axios.get("http://localhost:3001/commitment");
    const { nullifier, secret, commitment } = response.data;

    // ProtocolName-tokenName-denomination-networkdId-concatenationOfNullifierAndSecret
    setNote(
      `ZkMixer-eth-${ETH_DENOMINATION}-${chainId}-${nullifier}-${secret}`
    );

    try {
      writeContract({
        abi,
        address: ZK_MIXER_CONTRACT as `0x${string}`,
        functionName: "deposit",
        args: [commitment],
        value: BigInt(ETH_DENOMINATION),
      });
    } catch (err) {
      console.error(err);
    }
  }

  function handleCopy() {
    try {
      navigator.clipboard.writeText(note);
      setCopied(true);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleWithdraw() {
    const decodedProof = encodedProof?.split("-");
    if (!decodedProof || !address) {
      return;
    }
    const nullifier = decodedProof[decodedProof.length - 2];
    const secret = decodedProof[decodedProof.length - 1];
    const response = await axios.get(
      `http://localhost:3001/commitment?nullifier=${nullifier}&secret=${secret}`
    );
    const commitment = response.data.commitment;
    const nullifierHash = response.data.nullifierHash;
    const { leaves } = (await axios.get(`http://localhost:3001/leaves`)) as {
      leaves: string[];
    };
    const proof = generateProof({
      leaves,
      receipient: address,
      commitment,
      nullifierHash: nullifierHash,
      nullifier,
      secret,
    });
    writeContract({
      abi,
      address: ZK_MIXER_CONTRACT as `0x${string}`,
      functionName: "withdraw",
      args: [proof, merkleroot, nullifierHash, address],
    });
  }

  return (
    <div className=" flex gap-4 flex-col justify-center items-center  rounded-2xl p-5 shadow-lg ring-2 w-3/4 ">
      {isWithdraw ? (
        <div className="flex gap-4 flex-col justify-center items-center">
          <input
            onChange={(e) => {
              setEncodedProof(e.target.value);
            }}
            autoFocus={true}
            className="w-full px-4 py-2 text-lg text-gray-700 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
            type="text"
          />
          <div
            onClick={handleWithdraw}
            className=" bg-green-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer"
          >
            Withdraw
          </div>
          <div
            onClick={() => setIsWithdraw(false)}
            className=" bg-blue-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer "
          >
            Switch to deposit
          </div>
        </div>
      ) : (
        <div className="flex gap-4 flex-col justify-center items-center">
          <div
            onClick={handleDeposit}
            className=" bg-blue-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer h-10 "
          >
            {isPending ? "Initiating..." : "Deposit 0.0001 ETH"}
          </div>
          {error?.cause?.details && (
            <div className=" text-red-500 text-center">
              {error?.cause?.details as string}
            </div>
          )}
          {isConfirmaing && (
            <div className=" text-yellow-500">
              Transaction is processing... ⏳
            </div>
          )}
          {isConfirmed && (
            <div className=" text-green-500 flex flex-col gap-3 items-center">
              Transaction success , withdraw after 24 hours
              {note && (
                <div className=" flex items-center flex-col gap-2 py-2 text-center text-purple-500 pr-3 border-2 border-purple-500 rounded-2xl">
                  {note}
                  <span
                    onClick={handleCopy}
                    className="p-1 cursor-pointer border-2 rounded-xl font-extrabold text-black"
                  >
                    {copied ? "COPIED" : "COPY"}
                  </span>
                </div>
              )}
            </div>
          )}
          {txError && (
            <div className=" text-red-500 text-center">
              Sumitted transaction failed
            </div>
          )}
          <div
            onClick={() => setIsWithdraw(true)}
            className=" bg-green-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer"
          >
            have proof , Withdraw here
          </div>
        </div>
      )}
      <div className=" mt-4 text-sm text-slate-500">
        {" "}
        You are interacting with ::{" "}
        <Link
          className=" font-bold text-blue-400 underline"
          href={SEPOLIA_EXPLORER + ZK_MIXER_CONTRACT}
          target="_blank"
        >
          {ZK_MIXER_CONTRACT}
        </Link>
      </div>
    </div>
  );
}
