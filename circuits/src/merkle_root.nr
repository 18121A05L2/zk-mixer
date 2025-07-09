use poseidon::poseidon2;

pub fn compute_merkle_root(leaf: Field, merkle_proofs: [Field; 20], is_even: [bool; 20]) -> Field {
    let mut hash = leaf;

    for i in 0..20 {
        let (left, right) = if is_even[i] {
            (hash, merkle_proofs[i])
        } else {
            (merkle_proofs[i], hash)
        };
        hash = poseidon2::Poseidon2::hash([left, right], 2);
    }
    hash
}
