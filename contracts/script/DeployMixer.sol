// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {Script} from "forge-std/Script.sol";
import {ZkMixer} from "../src/ZkMixer.sol";
import {Poseidon2} from "@poseidon/Poseidon2.sol";
import {HonkVerifier} from "../src/Verifier.sol";
import {console} from "forge-std/console.sol";

contract DeployMixer is Script {
    uint256 constant DEPTH = 20;

    function run() external {
        vm.startBroadcast();
        Poseidon2 poseidon = new Poseidon2();
        address poseidonAddress = address(poseidon);

        HonkVerifier verifier = new HonkVerifier();
        address verifierAddress = address(verifier);

        ZkMixer zkMixer = new ZkMixer(verifierAddress, DEPTH, poseidonAddress);
        vm.stopBroadcast();
        console.log("ZkMixer deployed to:", address(zkMixer));
    }
}
