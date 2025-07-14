-include .env

.PHONY: buildVerifier

generateVerifier:
	nargo compile && bb write_vk --oracle_hash keccak -b ./target/circuits.json -o ./target/ && bb write_solidity_verifier -o ../contracts/src/Verifier.sol