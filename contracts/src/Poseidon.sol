// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {Poseidon2, Field, Poseidon2Lib} from "@poseidon/src/Poseidon2.sol";

contract Poseidon is Poseidon2 {
    using Field for *;

    function hash(Field.Type x, Field.Type y) public pure returns (bytes32) {
        return Poseidon2Lib.hash_2(x, y).toBytes32();
    }
}
