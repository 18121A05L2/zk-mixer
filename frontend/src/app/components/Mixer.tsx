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
import { convertProofToBytes } from "../utils";
import { Barretenberg } from "@aztec/bb.js";
import { Fr } from "@aztec/bb.js";
import { simulateContract } from "wagmi/actions";
import { config } from "@/config";
import { BaseError } from "viem";

interface CustomError extends BaseError {
  cause?: {
    details?: string;
  };
}

export default function Mixer() {
  const [encodedProof, setEncodedProof] = useState<string>();
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");
  const [withdrawErrMsg, setWithdrawErrMsg] = useState("");
  const [depositErrMsg, setDepositErrMsg] = useState("");
  const [proofGenerationInfo, setProofGenerationInfo] = useState("");
  const { writeContract, isPending, error, data } = useWriteContract();
  const { chainId, address } = useAccount();
  let barratenberg: Barretenberg;
  const {
    isLoading: isConfirmaing,
    isSuccess: isConfirmed,
    error: txError,
  } = useWaitForTransactionReceipt({
    hash: data,
  });

  async function handleDeposit() {
    const nullifier = Fr.random();
    const secret = Fr.random();
    if (!barratenberg) {
      barratenberg = await Barretenberg.new({ threads: 1 });
    }
    const commitment = await barratenberg.poseidon2Hash([nullifier, secret]);

    // ProtocolName-tokenName-denomination-networkdId-Nullifier-Secret
    setNote(
      `ZkMixer-eth-${ETH_DENOMINATION}-${chainId}-${nullifier}-${secret}`
    );

    const writeContractInfo = {
      abi,
      address: ZK_MIXER_CONTRACT as `0x${string}`,
      functionName: "deposit",
      args: [commitment.toString()],
      value: BigInt(ETH_DENOMINATION),
    };

    try {
      const simulationResponse = await simulateContract(
        config,
        writeContractInfo
      );
      console.log({ simulationResponse });
    } catch (err) {
      setDepositErrMsg("Failed to simulate transaction");
      console.error(err);
    }

    try {
      writeContract(writeContractInfo);
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
    setProofGenerationInfo("generating proof...");
    const decodedProof = encodedProof?.split("-");
    if (!decodedProof || !address) {
      setWithdrawErrMsg("Please enter the encoded proof");
      return;
    }
    const nullifier = decodedProof[decodedProof.length - 2];
    const secret = decodedProof[decodedProof.length - 1];
    if (!barratenberg) {
      barratenberg = await Barretenberg.new({ threads: 1 });
    }

    const commitment = await barratenberg.poseidon2Hash([
      Fr.fromString(nullifier),
      Fr.fromString(secret),
    ]);

    const nullifierHash = await barratenberg.poseidon2Hash([
      Fr.fromString(nullifier),
    ]);
    // backend
    // const leaves = (await axios
    //   .get(`http://localhost:3001/mixer/leaves`)
    //   .then((res) => res.data)) as string[];
    // TODO : undo this comment later
    // indexer
    // const leaves = await axios
    //   .post(
    //     "http://localhost:3001/graphql",
    //     {
    //       query: `
    //       query AllDeposits($orderBy: [DepositsOrderBy!]) {
    //         allDeposits(orderBy: $orderBy) {
    //           nodes {
    //             commitmennt
    //           }
    //         }
    //       }
    //     `,
    //       variables: {
    //         orderBy: "BLOCK_NUMBER_ASC",
    //       },
    //     },
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   )
    //   .then((res) => res.data)
    //   .then((graphqlRes) => {
    //     const finalOutput = graphqlRes.data.allDeposits.nodes.reduce(
    //       (acc: string[], node: { commitmennt: string }) => {
    //         acc.push(node.commitmennt);
    //         return acc;
    //       },
    //       []
    //     );
    //     return finalOutput;
    //   });
    const leaves = [
      "0x2a2f73526fcedf30b91bca5827679ce48d024753b2ca06217b99479c8f9911c1",
      "0x22b32ba4fdaddc6c212496febb78575d054ace0985a130df298c953634d2a803",
      "0x079cd038fb75ec74807b3efadefbd486c26c4707aff68b67261cbd795bb1fa3b",
      "0x0acf7635d83ae55448dd29af15a69364320f30bd853a4d6b20a05304d706bb32",
      "0x03f9e89ac3c5743507a37b33a7139eadb9b85815b815692d986ee57ee7557c14",
      "0x1a800b94519f17f22091ea1e84c6a23a1fba40808bbd3762b079ad0a4bac20ba",
      "0x29da70e2e2917fae8238f4ca50992e680032f84d295355acf86349870f25f043",
      "0x1c1caecb62347cc5a32cecc21bf80ff51c04d57f658f6e2faf711dfa9233c61d",
    ];

    const { proof, merkleRoot } = await generateProof({
      leaves,
      receipient: address,
      commitment: commitment.toString(),
      nullifierHash: nullifierHash.toString(),
      nullifier,
      secret,
      setWithdrawErrMsg,
      setProofGenerationInfo,
    });

    const writeContractInfo = {
      abi,
      address: ZK_MIXER_CONTRACT as `0x${string}`,
      functionName: "withdraw",
      args: [
        convertProofToBytes(proof),
        merkleRoot,
        nullifierHash.toString(),
        address,
      ],
    };

    try {
      const simulationResponse = await simulateContract(
        config,
        writeContractInfo
      );
      console.log({ simulationResponse });
    } catch (err) {
      setWithdrawErrMsg("Failed to simulate transaction");
      console.error(err);
    }

    try {
      writeContract(writeContractInfo);
    } catch (err) {
      console.error(err);
    }
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
            {isPending ? "Initiating withdrawl..." : "Withdraw"}
          </div>
          {withdrawErrMsg && (
            <div className=" text-red-500 text-center">{withdrawErrMsg}</div>
          )}
          {error && (error as CustomError).cause?.details && (
            <div className="text-red-500 text-center">
              {(error as CustomError).cause?.details}
            </div>
          )}
          {proofGenerationInfo && (
            <div className=" text-green-500 text-center">
              {proofGenerationInfo}
            </div>
          )}
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
          {depositErrMsg && (
            <div className=" text-red-500 text-center">{depositErrMsg}</div>
          )}
          {error && (error as CustomError).cause?.details && (
            <div className="text-red-500 text-center">
              {(error as CustomError).cause?.details}
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
        Contract you are interacting with ::{" "}
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
