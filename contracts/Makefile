-include .env

arg1=""
arg2=""

.PHONY: install deployPoseidon executeHash executeGenerateProof

install:
	forge install https://github.com/zemse/poseidon2-evm && forge install https://github.com/foundry-rs/forge-std

deployPoseidon:
	forge create src/mocks/Poseidon2Mock.sol:Poseidon2Mock --rpc-url $(RPC_URL) --account one_anvil --broadcast

executeHash:
	cast call ${POSEIDON_ADDR} "hash_2(uint256,uint256)" ${arg1} ${arg2} --private-key ${ANVIL_PRIVATE_KEY}
# 	arg1=uint256(keccak256(${arg1}))%${MAX_POSEIDON_NUM}

deployMixer:
	forge script script/DeployMixer.sol:DeployMixer --rpc-url $(SEPOLIA_RPC_URL) --account real_account_1 --broadcast --verify --etherscan-api-key $(ETHERSCAN_API_KEY)

executeGenerateProof:
	npx tsx ./js-scripts/generateProof.ts 0x26fbc059820b582c67008eb8ae79e10d27c1f54d77b3c0ef7b9efd6a41c6089f 0x293f52edcc5bc9d681e74d9e363fa212fdb2c6d548bfbe6bc91932c548c97139 0x6CA6d1e2D5347Bfab1d91e883F1915560e09129D 0x1426bd4b39c4418075144c002e69ca8354065b13f1c9335b87391b0394b529f5

	