import { createConfig, http, injected } from "wagmi";
import { mainnet, sepolia } from "viem/chains";
import { metaMask, walletConnect } from "wagmi/connectors";
import {
  MAINNET_RPC_URL,
  PROJECT_ID,
  SEPOLIA_RPC_URL,
} from "./app/utils/contants";

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(MAINNET_RPC_URL, { name: "mainnet" }),
    [sepolia.id]: http(SEPOLIA_RPC_URL, { name: "sepolia" }),
  },
  ssr: true,
  connectors: [metaMask(), walletConnect({ projectId: PROJECT_ID })],
});
