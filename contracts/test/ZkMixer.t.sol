// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {Test} from "forge-std/Test.sol";
import {ZkMixer} from "../src/ZkMixer.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {Poseidon2} from "@poseidon/Poseidon2.sol";
import {console} from "forge-std/console.sol";
import {Vm} from "forge-std/Vm.sol";

contract MixerTests is Test {
    ZkMixer zkMixer;
    uint256 constant DEPTH = 20;
    uint256 public constant ETH_DENOMINATION = 0.0001 ether;
    uint256 public constant USER_INITIAL_BALANCE = 1 ether;
    address user;

    function setUp() public {
        HonkVerifier verifier = new HonkVerifier();
        Poseidon2 poseidon = new Poseidon2();
        zkMixer = new ZkMixer(address(verifier), DEPTH, address(poseidon));
        user = makeAddr("user");
        vm.deal(user, USER_INITIAL_BALANCE);
    }

    function getCommitment() public returns (bytes32 nullifier, bytes32 secret, bytes32 commitment) {
        string[] memory inputs = new string[](3);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "./js-scripts/generateCommitment.ts";
        bytes memory result = vm.ffi(inputs);
        (nullifier, secret, commitment) = abi.decode(result, (bytes32, bytes32, bytes32));
    }

    function getZkProof(bytes32 _nullifier, bytes32 _secret, address _receipient, bytes32[] memory leaves)
        public
        returns (
            bytes memory proof,
            bytes32[] memory publicInputs,
            bytes32 root,
            bytes32 nullifierHash,
            address recipient
        )
    {
        string[] memory inputs = new string[](6 + leaves.length);
        inputs[0] = "npx";
        inputs[1] = "tsx";
        inputs[2] = "./js-scripts/generateProof.ts";
        inputs[3] = vm.toString(_nullifier);
        inputs[4] = vm.toString(_secret);
        inputs[5] = vm.toString(_receipient);
        for (uint256 i = 0; i < leaves.length; i++) {
            inputs[6 + i] = vm.toString(leaves[i]);
        }

        bytes memory result = vm.ffi(inputs);
        (proof, publicInputs) = abi.decode(result, (bytes, bytes32[]));
        root = publicInputs[0];
        nullifierHash = publicInputs[1];
        recipient = address(uint160(uint256(publicInputs[2])));
    }

    function testProof() public {
        (bytes32 nullifier, bytes32 secret, bytes32 commitment) = getCommitment();
        console.log("nullifier");
        console.logBytes32(nullifier);
        console.log("secret");
        console.logBytes32(secret);
        console.log("commitment");
        console.logBytes32(commitment);
        assert(commitment != bytes32(0));
        assert(secret != bytes32(0));
        assert(nullifier != bytes32(0));

        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = commitment;

        (bytes memory proof, bytes32[] memory publicInputs,,,) = getZkProof(nullifier, secret, user, leaves);

        assert(proof.length > 0);
        console.log(publicInputs.length);
        assert(publicInputs[0] != bytes32(0));
        assert(publicInputs[1] != bytes32(0));
        assert(publicInputs[2] != bytes32(0));
    }

    function testDeposit() public {
        (,, bytes32 commitment) = getCommitment();
        vm.startPrank(user);
        vm.recordLogs();
        zkMixer.deposit{value: ETH_DENOMINATION}(commitment);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool isCommitmentAdded = zkMixer.s_commitments(commitment);
        assertEq(isCommitmentAdded, true);
        assertEq(ZkMixer.Deposit.selector, logs[0].topics[0]);
        assertEq(address(zkMixer).balance, ETH_DENOMINATION);
        vm.stopPrank();
    }

    function testWithdraw() public {
        vm.startPrank(user);
        (bytes32 nullifier, bytes32 secret, bytes32 commitment) = getCommitment();
        bytes32[] memory leaves = new bytes32[](1);
        leaves[0] = commitment;
        (bytes memory proof,, bytes32 root, bytes32 nullifierHash, address receipt) =
            getZkProof(nullifier, secret, user, leaves);
        zkMixer.deposit{value: ETH_DENOMINATION}(commitment);
        zkMixer.withdraw(proof, root, nullifierHash, receipt);
        assertEq(address(zkMixer).balance, 0);
        assertEq(address(user).balance, USER_INITIAL_BALANCE);
        vm.stopPrank();
    }
}
