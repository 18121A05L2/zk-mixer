"use client";
import { useAccount, useDisconnect } from "wagmi";
import ConnectWallet from "./components/ConnectWallet";
import Mixer from "./components/Mixer";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  console.log({ isConnected });
  return (
    <div className=" bg-white w-[70vw] min-h-[50vh] rounded-4xl flex items-center justify-center py-10">
      {isConnected ? (
        <div className=" flex flex-col gap-10 items-center ">
          <div className=" bg-white p-5 rounded-2xl flex flex-col gap-6 ">
            <div className=" text-center text-neutral-600">{address}</div>
            <div
              className=" text-center bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-6 rounded-xl shadow-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-300 transition duration-300 w-full"
              onClick={() => disconnect()}
            >
              Disconnect
            </div>
          </div>
          <Mixer />
        </div>
      ) : (
        <ConnectWallet />
      )}
    </div>
  );
}
