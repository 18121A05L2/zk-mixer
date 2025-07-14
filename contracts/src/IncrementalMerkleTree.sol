// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.2;

import {Poseidon2} from "@poseidon/Poseidon2.sol";
import {Field} from "@poseidon/Field.sol";

/**
 * @title IncrementalMerkleTree
 * @author LakshmiSanikommu
 * @notice with this we can able to proove the commitment was present in the merkle tree
 */
contract IncrementalMerkleTree {
    // Hex code link - https://github.com/zemse/poseidon2-evm/blob/4c52b46d82659df6d11d67b251b6aea63c8b4203/src/Field.sol#L8
    uint256 public constant MAX_POSEIDON_HASH_NUMBER =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant MAX_ROOT_HASH = 20;
    // in this project we are going to use the depth as 20
    uint256 public immutable i_depth;
    Poseidon2 public immutable i_Poseidon;

    uint256 public s_nextLeafIndex = 0;
    uint256 public s_nextRootIndex = 0;

    bytes32[20] public s_roots;
    mapping(uint256 => bytes32) public s_cachedSubTrees;

    error IMT_InvalidTreeDepth(uint256 _depth);
    error IMT_MerkleTreeOverflow(uint256 _currentLeafIndex);
    error IMT_DepthOutOfBound(uint256 _depth);
    error IMT_DepthShouldNotBeZero(uint256 _depth);

    constructor(uint256 _depth, address _poseidon) {
        if (_depth == 0) revert IMT_DepthShouldNotBeZero(_depth);
        if (_depth > 20) revert IMT_DepthOutOfBound(_depth);
        i_depth = _depth;
        s_roots[0] = constantHash(i_depth);
        i_Poseidon = Poseidon2(_poseidon);
    }

    /**
     *
     * @param _leaf This is the commitment of the user adding into the merkle tree
     * @dev here we are just mimic the insertion process and store the cached subtrees and root and and these cached subtrees can help us to rebuild the whole tree if needed
     */
    function _insert(bytes32 _leaf) internal returns (uint256) {
        uint256 _currentLeafIndex = s_nextLeafIndex;

        if (_currentLeafIndex >= 2 ** i_depth) revert IMT_MerkleTreeOverflow(_currentLeafIndex);

        bytes32 left;
        bytes32 right;
        bytes32 currentHash = _leaf;

        for (uint256 i = 0; i < i_depth; i++) {
            if (_currentLeafIndex % 2 == 0) {
                left = currentHash;
                right = constantHash(i);
                s_cachedSubTrees[i] = currentHash;
            } else {
                right = currentHash;
                left = s_cachedSubTrees[i];
            }
            currentHash = Field.toBytes32(i_Poseidon.hash_2(Field.toField(left), Field.toField(right)));
            // with this halving we can able to check whether we are going to update left or right index at each level
            _currentLeafIndex /= 2;
        }

        s_nextLeafIndex++;
        // we are checking only upto 20 recent roots ,so bounding rootIndex to max root index
        uint256 newRootIndex = (s_nextRootIndex + 1) % MAX_ROOT_HASH;
        s_nextRootIndex = newRootIndex;

        s_roots[newRootIndex] = currentHash;

        return _currentLeafIndex;
    }

    /**
     *
     * @param _root Root of the commitments merkle tree
     * @dev This exists to support , if one generates a proof it will valid for upto 20 deposits after this proof is generated
     */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
        // check if they are trying to bypass the check by passing a zero root which is the defualt value
        if (_root == bytes32(0)) {
            return false;
        }
        uint256 currentRootIndex = s_nextRootIndex;
        uint256 cachedRootIndex = s_nextRootIndex;

        do {
            if (s_roots[currentRootIndex] == _root) return true;

            if (currentRootIndex == 0) currentRootIndex = MAX_ROOT_HASH;

            currentRootIndex--;
        } while (currentRootIndex != cachedRootIndex);

        return false;
    }

    /**
     *
     * @param _depth This is the depth of the merkle tree
     * @dev This will gives us the constant hash based on the depth of the merkle tree and we will use this to fill the non filled right most leaves of the incremental merkle tree
     *      here we are using the has of - poseidonHash("LakshmiSanikommu")
     */
    function constantHash(uint256 _depth) public view returns (bytes32 _hash) {
        // bytes32(uint256(keccak256("LakshmiSanikommu"))%21888242871839275222246405745257275088548364400416034343698204186575808495617)
        // TODO : why are we doing keccack here instead of hasing directly using poseidon
        // - is it because poseidon does not support string
        if (_depth == 0) return bytes32(0x1345d529f819bf7001641d2aeb20a5b8ef59e711d1f6c06b218db95a5782a86e);
        if (_depth == 1) return bytes32(0x2575891611affb9b4b8ee8e1fcbd88e9971c23c647ce02f425f3c39187436f83);
        if (_depth == 2) return bytes32(0x22ab4899b4b6afdd318dd19fe23295d35c4625b68d17c4e49720233f00948e8d);
        if (_depth == 3) return bytes32(0x1bb74cc2957327dfad5f1daffb16c666535d6c0ac1707e116e4639475b9a3255);
        if (_depth == 4) return bytes32(0x25ef148c61128edbd79c327f5e4238c6d1d374f3483d3fed583b34d94caa454d);
        if (_depth == 5) return bytes32(0x2c8ab26b7cb21fdf2d80a45645734f026c96835f38cda1509fa4dcc6c6d18280);
        if (_depth == 6) return bytes32(0x0bbc7377980389e13ac415a620332352e4923554511f2e5efde2a292183589ac);
        if (_depth == 7) return bytes32(0x2250e419c9291056ae9dbc11adcf0be56cd7fa1beab83298eddcf5d167312652);
        if (_depth == 8) return bytes32(0x2f81f8bd2fbf6c57d150a481e15dccdaa449bef9c3248dba86f82581bad0b5af);
        if (_depth == 9) return bytes32(0x2efef55ccdf5932404db96007befdd1f316147bc57166161fc12495e75a70bc5);
        if (_depth == 10) return bytes32(0x2563b416c20155c723eb689265475716f4d923b3eec84c7c58a103c6fbaad9de);
        if (_depth == 11) return bytes32(0x0448a4740fb73c75df3146234a7736768ebdceab4ab50ec1358cf5e4766634e2);
        if (_depth == 12) return bytes32(0x0327b2fa19c0394893f6247e3c7bf90048e9eb1169c78b760ac0ff37e010192d);
        if (_depth == 13) return bytes32(0x284ef67857a2885c5131620039e5fa10f6ceb2874866c97d721af35e305cdd35);
        if (_depth == 14) return bytes32(0x2141346c13dc0e8babed8577c075b0e03d8df35cd9abcc512b7c911e3a51d657);
        if (_depth == 15) return bytes32(0x14d3376b456770b960ee8ba957dbc31697213f19406b248ec8a393a35770b10c);
        if (_depth == 16) return bytes32(0x2c26855bf3aaa57d14b2b1bb3f6d270524bcfa16c1ffdbe4b52508da1c72890e);
        if (_depth == 17) return bytes32(0x19e30204d41ba0861b4d4410b6f272b23943b57be4ee208208ef56e76e7655e2);
        if (_depth == 18) return bytes32(0x157aed3bfc38346bc39ca67ba197b32ab19e743f6669b1da4d2b8b85c5ae2ada);
        if (_depth == 19) return bytes32(0x1540940da8def917d70529b57e56ab4f463a0328ff19899746c510b7ba0eef12);
        if (_depth == 20) return bytes32(0x1a0ebe8a927594dcf8c021852ac6866cb8fd94e4a100a7fb3ffdfe0eea396530);
        if (_depth > i_depth) revert IMT_InvalidTreeDepth(_depth);
    }
}
