"use client";
import { useConnect } from "wagmi";

export default function ConnectWallet() {
  const { connect, connectors } = useConnect();
  debugger;
  return (
    <div>
      <h1>ConnectWallet</h1>
    </div>
  );
}
