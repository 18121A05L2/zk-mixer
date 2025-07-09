use poseidon::poseidon2;

mod merkle_root;

fn main(
    // public inputs
    root: pub Field,
    nullifierHash: pub Field,
    receipient: pub Field,
    // private inputs
    secret: Field,
    nullifier: Field,
    merkle_proofs: [Field; 20],
    is_even: [bool; 20],
) {
    // compute the commitment
    let commitment: Field = poseidon2::Poseidon2::hash([nullifier, secret], 2);

    // veriify the nullifierHash
    let generatedNullifierHash: Field = poseidon2::Poseidon2::hash([nullifier], 1);
    assert(generatedNullifierHash == nullifierHash);

    // verify the root
    let computedMerkleRoot: Field =
        merkle_root::compute_merkle_root(commitment, merkle_proofs, is_even);
    assert(computedMerkleRoot == root);

    let binding_address = receipient * receipient;
    assert(binding_address == receipient * receipient)
}
