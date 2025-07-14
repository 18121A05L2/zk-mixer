// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {IncrementalMerkleTree} from "./IncrementalMerkleTree.sol";
import {IVerifier} from "./Verifier.sol";

/**
 * @title Example version of the Tornado cash
 * @author Lakshmi Sanikommu
 * @notice This contract can helps us to achieve privacy by delinking between the depositor address and the withdrawal address
 */
contract ZkMixer is IncrementalMerkleTree {
    IVerifier immutable i_Verifier;

    uint256 public constant ETH_DENOMINATION = 0.0001 ether;

    mapping(bytes32 => bool) public s_commitments;
    mapping(bytes32 => bool) public s_nullifierHashes;

    event Deposit(address indexed depositor, bytes32 indexed commitmennt, uint256 insertedLeafIndex);
    event Withdrawal(address indexed recipient, bytes32 nullifierHash);

    error ZkMixer_CommitmentAlreadyExists(bytes32 _commitment);
    error ZkMixer_InsufficientEthDeposit(uint256 _userDepositAmount);
    error ZkMixer_NullifierAlreadyUsed(bytes32 _nullifierHash);
    error ZkMixer_ProofInvalid(bytes _proof);
    error ZkMixer_TransferFundsFailed();
    error ZkMixer_RootInvalid(bytes32 _root);
    error ZkMixer_CommitmentIsGreaterThanMaxPoseidon(bytes32 _commitment);

    constructor(address _verifier, uint256 _depth, address _poseidon) IncrementalMerkleTree(_depth, _poseidon) {
        i_Verifier = IVerifier(_verifier);
    }

    /**
     * @param _commitment this will be generated using the poseidonHash(nullifier,secret)
     * @return This represents the deposit success or failure
     * @notice user needs to deposit the specified denomination amount
     * @dev poseidon hash was less than the keccak256 hash
     */
    function deposit(bytes32 _commitment) external payable returns (bool) {
        // we need to prevent the duplicate being added two times
        if (s_commitments[_commitment]) revert ZkMixer_CommitmentAlreadyExists(_commitment);

        if (msg.value != ETH_DENOMINATION) revert ZkMixer_InsufficientEthDeposit(msg.value);

        // TODO : do we need to check for the commitment greater than the commitment
        if (uint256(_commitment) > MAX_POSEIDON_HASH_NUMBER) {
            revert ZkMixer_CommitmentIsGreaterThanMaxPoseidon(_commitment);
        }

        s_commitments[_commitment] = true;

        uint256 leafIndex = _insert(_commitment);

        emit Deposit(msg.sender, _commitment, leafIndex);

        return true;
    }

    /**
     *
     * @param _proof We will generate this proof offchain using the noir and barratenburg js packages by providing the public and private inputs to the circuit
     * @param _root This is the root of the merkle tree where we have added the commitment
     * @param _nullifierHash This is used to prevent the user from double spending
     * @param _recipient This will helps us to link the proof that was generated using the circuit to the prover address so that we can prevent frontrunning by the ethereum validators who can able to see the transaction details when executing
     */
    function withdraw(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient) external {
        if (s_nullifierHashes[_nullifierHash]) revert ZkMixer_NullifierAlreadyUsed(_nullifierHash);

        // we need to atleast check the most recent 32 roots , this is becuase when a users deposits and that user generates a proof and before this proof is executed if user2 deposits , then the root hash will be changed
        // if user1 wants to withdraw some time later , he again needs to regenerate the proof and can be able to withdraw with that , because his commitment was still part of the merkle tree
        if (!isKnownRoot(_root)) revert ZkMixer_RootInvalid(_root);

        bytes32[] memory publicInputs = new bytes32[](3);
        publicInputs[0] = _root;
        publicInputs[1] = _nullifierHash;
        publicInputs[2] = bytes32(uint256(uint160(_recipient)));

        if (!i_Verifier.verify(_proof, publicInputs)) revert ZkMixer_ProofInvalid(_proof);

        (bool success,) = _recipient.call{value: ETH_DENOMINATION}("");

        if (!success) revert ZkMixer_TransferFundsFailed();

        s_nullifierHashes[_nullifierHash] = true;

        emit Withdrawal(_recipient, _nullifierHash);
    }
}
