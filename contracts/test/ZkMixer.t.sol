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
    address realUser = 0xE959A2c1c3F108697c244b98C71803b6DcD77764;
    uint256 sepoliaForkId;
    string SEPOLIA_RPC_URL = vm.envString("SEPOLIA_RPC_URL");
    address SEPOLIA_ZKMIXER_ADDRESS = vm.envAddress("SEPOLIA_ZKMIXER_ADDRESS");
    bool RUN_SEPOLIA_TESTS = vm.envBool("RUN_SEPOLIA_TESTS");

    function setUp() public {
        HonkVerifier verifier = new HonkVerifier();
        Poseidon2 poseidon = new Poseidon2();
        zkMixer = new ZkMixer(address(verifier), DEPTH, address(poseidon));
        user = makeAddr("user");
        vm.deal(user, USER_INITIAL_BALANCE);
        sepoliaForkId = vm.createFork(SEPOLIA_RPC_URL);
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
        assertGt(result.length, 0, "Failed to generate proof from generateProof.ts");
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

    function testSepoliaWithdrawNote7() public {
        if (!RUN_SEPOLIA_TESTS) {
            vm.skip(true);
        }
        vm.selectFork(sepoliaForkId);
        ZkMixer zkMixerSepolia = ZkMixer(SEPOLIA_ZKMIXER_ADDRESS);
        vm.startPrank(user);
        uint256 balanceBefore = realUser.balance;
        //    `ZkMixer-eth-${ETH_DENOMINATION}-${chainId}-${nullifier}-${secret}`
        //Note7 - ZkMixer-eth-100000000000000-11155111-0x3024cbace94bc745016f562b48b998698542aa5e0d86db3330c2d3a4aeda7399-0x05b1e0fd9eefeb5774b313b46e3eee959854be16604074ad561b54e753549071
        bytes32 nullifier = 0x3024cbace94bc745016f562b48b998698542aa5e0d86db3330c2d3a4aeda7399;
        bytes32 secret = 0x05b1e0fd9eefeb5774b313b46e3eee959854be16604074ad561b54e753549071;

        bytes32[] memory leaves = new bytes32[](8);
        leaves[0] = 0x2a2f73526fcedf30b91bca5827679ce48d024753b2ca06217b99479c8f9911c1;
        leaves[1] = 0x22b32ba4fdaddc6c212496febb78575d054ace0985a130df298c953634d2a803;
        leaves[2] = 0x079cd038fb75ec74807b3efadefbd486c26c4707aff68b67261cbd795bb1fa3b;
        leaves[3] = 0x0acf7635d83ae55448dd29af15a69364320f30bd853a4d6b20a05304d706bb32;
        leaves[4] = 0x03f9e89ac3c5743507a37b33a7139eadb9b85815b815692d986ee57ee7557c14;
        leaves[5] = 0x1a800b94519f17f22091ea1e84c6a23a1fba40808bbd3762b079ad0a4bac20ba;
        leaves[6] = 0x29da70e2e2917fae8238f4ca50992e680032f84d295355acf86349870f25f043;
        leaves[7] = 0x1c1caecb62347cc5a32cecc21bf80ff51c04d57f658f6e2faf711dfa9233c61d;

        (bytes memory proof,, bytes32 root, bytes32 nullifierHash, address receipt) =
            getZkProof(nullifier, secret, realUser, leaves);
        zkMixerSepolia.withdraw(proof, root, nullifierHash, receipt);

        uint256 balanceAfterWithdraw = realUser.balance;
        assertEq(balanceBefore + ETH_DENOMINATION, balanceAfterWithdraw);

        vm.stopPrank();
    }

    function testSepoliaWithdrawNote8() public {
        if (!RUN_SEPOLIA_TESTS) {
            vm.skip(true);
        }
        vm.selectFork(sepoliaForkId);
        ZkMixer zkMixerSepolia = ZkMixer(SEPOLIA_ZKMIXER_ADDRESS);
        vm.startPrank(user);
        uint256 balanceBefore = realUser.balance;
        //       `ZkMixer-eth-${ETH_DENOMINATION}-${chainId}-${nullifier}-${secret}`
        //Note8 - ZkMixer-eth-100000000000000-11155111-0x14f20d98288453cbff51b3ceb3e2a5c1a6077f52d662ad8729515b5babf7c983-0x08436cd23652588a183530e7ecfb11cb2cbe90d823411b4597b725bff15b64e9
        bytes32 nullifier = 0x14f20d98288453cbff51b3ceb3e2a5c1a6077f52d662ad8729515b5babf7c983;
        bytes32 secret = 0x08436cd23652588a183530e7ecfb11cb2cbe90d823411b4597b725bff15b64e9;

        bytes32[] memory leaves = new bytes32[](8);
        leaves[0] = 0x2a2f73526fcedf30b91bca5827679ce48d024753b2ca06217b99479c8f9911c1;
        leaves[1] = 0x22b32ba4fdaddc6c212496febb78575d054ace0985a130df298c953634d2a803;
        leaves[2] = 0x079cd038fb75ec74807b3efadefbd486c26c4707aff68b67261cbd795bb1fa3b;
        leaves[3] = 0x0acf7635d83ae55448dd29af15a69364320f30bd853a4d6b20a05304d706bb32;
        leaves[4] = 0x03f9e89ac3c5743507a37b33a7139eadb9b85815b815692d986ee57ee7557c14;
        leaves[5] = 0x1a800b94519f17f22091ea1e84c6a23a1fba40808bbd3762b079ad0a4bac20ba;
        leaves[6] = 0x29da70e2e2917fae8238f4ca50992e680032f84d295355acf86349870f25f043;
        leaves[7] = 0x1c1caecb62347cc5a32cecc21bf80ff51c04d57f658f6e2faf711dfa9233c61d;

        (bytes memory proof,, bytes32 root, bytes32 nullifierHash, address receipt) =
            getZkProof(nullifier, secret, realUser, leaves);
        console.logBytes(proof);
        console.logBytes32(root);
        console.logBytes32(nullifierHash);
        console.log(receipt);
        zkMixerSepolia.withdraw(proof, root, nullifierHash, receipt);

        uint256 balanceAfterWithdraw = realUser.balance;
        assertEq(balanceBefore + ETH_DENOMINATION, balanceAfterWithdraw);

        vm.stopPrank();
    }
}
