// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {Poseidon2, Field} from "@poseidon/src/Poseidon2.sol";

contract IncrementalMerkleTree {
    uint256 public constant ROOT_HISTORY_SIZE = 8;
    uint8 public immutable i_depth;
    Poseidon2 immutable ic_poseidon2;

    uint256 public s_nextLeafIndex = 0;
    bytes32[] public s_tree;
    mapping(uint256 => bytes32) public s_roots;
    uint256 public s_currentRootIndex;

    error IMT_ZeroDepth();
    error IMT_DepthMoreThanMAx();
    error IMT_DepthIndesBoundError();
    error IMT_TreeIsFull();
    error IMT_InvalidRootHash();

    constructor(uint8 _depth, address _poseidon) {
        if (_depth == 0) revert IMT_ZeroDepth();
        if (_depth > 8) revert IMT_DepthMoreThanMAx();
        i_depth = _depth;
        ic_poseidon2 = Poseidon2(_poseidon);
        s_roots[0] = zeroes(_depth);

        // we need to initialize the tree with zero or constant hash value subtrees
    }

    function zeroes(uint256 _depth) public pure returns (bytes32 _subTreeRoot) {
        // bytes32(uint256(keccak256("LakshmiSanikommu"))%21888242871839275222246405745257275088548364400416034343698204186575808495617)
        // https://github.com/zemse/poseidon2-evm/blob/4c52b46d82659df6d11d67b251b6aea63c8b4203/src/Field.sol#L8
        if (_depth == 0) return 0x1345d529f819bf7001641d2aeb20a5b8ef59e711d1f6c06b218db95a5782a86e;
        if (_depth == 1) return 0x2575891611affb9b4b8ee8e1fcbd88e9971c23c647ce02f425f3c39187436f83;
        if (_depth == 2) return 0x22ab4899b4b6afdd318dd19fe23295d35c4625b68d17c4e49720233f00948e8d;
        if (_depth == 3) return 0x1bb74cc2957327dfad5f1daffb16c666535d6c0ac1707e116e4639475b9a3255;
        if (_depth == 4) return 0x25ef148c61128edbd79c327f5e4238c6d1d374f3483d3fed583b34d94caa454d;
        if (_depth == 5) return 0x2c8ab26b7cb21fdf2d80a45645734f026c96835f38cda1509fa4dcc6c6d18280;
        if (_depth == 6) return 0x0bbc7377980389e13ac415a620332352e4923554511f2e5efde2a292183589ac;
        if (_depth == 7) return 0x2250e419c9291056ae9dbc11adcf0be56cd7fa1beab83298eddcf5d167312652;
        if (_depth == 8) return 0x2f81f8bd2fbf6c57d150a481e15dccdaa449bef9c3248dba86f82581bad0b5af;
        if (_depth > 8) revert IMT_DepthIndesBoundError();
    }

    function insert(bytes32 _commitment) internal returns (uint256 _insertedLeafIndex) {
        // check whether the tree is full or not
        uint256 currentLeafIndex = s_nextLeafIndex;
        if (currentLeafIndex >= 2 ** i_depth) revert IMT_TreeIsFull();
        // we need to add this leaf to the tree
        // we need to decide on which one do we need to use , cached filled subtree or zero depth subtree
        bytes32 currentHash = _commitment;
        bytes32 left;
        bytes32 right;

        for (uint256 i = 0; i < i_depth; i++) {
            if (currentLeafIndex % 2 == 0) {
                // here we need to cache the current index to use it further as the cached subtree
                // right subtree will be the zero depth subtree
                left = currentHash;
                right = zeroes(i);
                s_tree[i] = left;
            } else {
                left = s_tree[i];
                right = currentHash;
            }
            currentHash = Field.toBytes32(ic_poseidon2.hash_2(Field.toField(left), Field.toField(right)));
            currentLeafIndex = currentLeafIndex / 2;
        }
        // we need to store the current root index , as this will be modified each time when we add a leaf node
        // s_root = currentHash;
        uint256 currentRootIndex = (s_currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        s_roots[currentRootIndex] = currentHash;

        // we need to increment the current tree index at the end
        s_nextLeafIndex++;
        s_currentRootIndex++;
        _insertedLeafIndex = currentLeafIndex;
    }

    function isKnownRoot(bytes32 _root) public view returns (bool) {
        if (_root == bytes32(0)) revert IMT_InvalidRootHash();

        uint256 i = s_currentRootIndex;
        uint256 _currentRootIndex = s_currentRootIndex;

        do {
            if (_root == s_roots[i]) return true;
            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        } while (i != _currentRootIndex);
        return false;
    }
}
