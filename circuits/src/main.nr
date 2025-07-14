use poseidon::poseidon2;
mod merkle_tree;
fn main(
    // public inputs
    root: pub Field,
    nullifier_hash: pub Field,
    _receipient: pub Field,
    // private inputs
    secret: Field,
    nullifier: Field,
    merkle_proofs: [Field; 20],
    is_even: [bool; 20],
) {
    // need to validate the nullifier hash
    let commitment = poseidon2::Poseidon2::hash([nullifier, secret], 2);

    let nullifier_hash_generated = poseidon2::Poseidon2::hash([nullifier], 1);

    assert(nullifier_hash == nullifier_hash_generated, "nullifier was wrong");

    let generated_root = merkle_tree::generate_root(merkle_proofs, is_even, commitment);

    assert(root == generated_root, "merkle root was wring")
}
