"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useConnect } from "wagmi";

export default function ConnectWallet() {
  const { connect, connectors } = useConnect();
  return (
    <div className=" flex flex-col justify-center items-center">
      <h1 className=" font-extrabold text-neutral-700 text-center text-3xl pb-10">
        ZK Mixer
      </h1>
      {connectors.map((connector) => (
        <div key={connector.id} onClick={() => connect({ connector })}>
          <h1 className=" font-semibold text-cyan-300 text-center cursor-pointer  mb-4 p-3 rounded-2xl bg-orange-400 font-sans w-min min-w-2xs">
            {connector.name}
          </h1>
        </div>
      ))}
      <ConnectButton />
      <div className=" font-semibold text-neutral-600 text-center pt-5">
        Please connect your wallet
      </div>
    </div>
  );
}
