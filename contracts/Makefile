-include .env

.PHONY: build
deploy-poseidon:
	forge create src/Poseidon.sol:Poseidon --rpc-url $(RPC_URL) --account one_anvil --broadcast
