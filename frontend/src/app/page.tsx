import ConnectWallet from "./components/ConnectWallet";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 py-12">
      <ConnectWallet />
    </div>
  );
}
