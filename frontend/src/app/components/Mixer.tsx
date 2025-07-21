import { useState } from "react";

export default function Mixer() {
  const [proof, setProof] = useState<string>();
  function handleDeposit() {}
  return (
    <div className=" flex gap-2 flex-col justify-center items-center rounded-2xl p-5 shadow-lg ">
      <input
        onChange={(e) => {
          setProof(e.target.value);
        }}
        autoFocus={true}
        className="w-full px-4 py-2 text-lg text-gray-700 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-center"
        type="text"
      />
      <div
        onClick={handleDeposit}
        className=" bg-blue-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer "
      >
        Deposit
      </div>
      <div className=" bg-green-500 rounded-[5px] text-center p-2 px-6 min-w-32 cursor-pointer">
        Withdraw
      </div>
    </div>
  );
}
