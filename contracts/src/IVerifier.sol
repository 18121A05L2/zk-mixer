// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

interface IVerifier {
    function verify(bytes32 proof, bytes32[] calldata publicInputs) external returns (bool);
}
