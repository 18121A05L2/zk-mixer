import { createConfig, http, injected } from "wagmi";
import { mainnet, sepolia } from "viem/chains";
import { metaMask, walletConnect } from "wagmi/connectors";

const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "";
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_MAINNET_RPC_URL || "";
const PROJECT_ID = process.env.NEXT_PUBLIC_WC_PROJECT_ID || "";
console.log({ PROJECT_ID });

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(MAINNET_RPC_URL, { name: "mainnet" }),
    [sepolia.id]: http(SEPOLIA_RPC_URL, { name: "sepolia" }),
  },
  ssr: true,
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId: PROJECT_ID }),
  ],
});
