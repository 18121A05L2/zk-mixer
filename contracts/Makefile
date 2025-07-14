-include .env

arg1=""
arg2=""

.PHONY: install

install:
	forge install https://github.com/zemse/poseidon2-evm && forge install https://github.com/foundry-rs/forge-std

deployPoseidon:
	forge create src/mocks/Poseidon2Mock.sol:Poseidon2Mock --rpc-url $(RPC_URL) --account one_anvil --broadcast

executeHash:
	cast call ${POSEIDON_ADDR} "hash_2(uint256,uint256)" ${arg1} ${arg2} --private-key ${ANVIL_PRIVATE_KEY}
# 	arg1=uint256(keccak256(${arg1}))%${MAX_POSEIDON_NUM}

	