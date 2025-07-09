-include .env

.PHONY: build generateVk

generateVk:
	bb write_vk --oracle_hash keccak -b ./target/circuits.json -o ./target/

generateContract:
	bb write_solidity_verifier -k ./target/vk  -o ../contracts/src/Verifier.sol