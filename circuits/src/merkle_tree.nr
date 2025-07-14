use poseidon::poseidon2;

pub fn generate_root(merkle_proofs: [Field; 20], is_even: [bool; 20], _commitment: Field) -> Field {
    let mut currentHash = _commitment;

    for i in 0..20 {
        let (left, right) = if is_even[i] {
            (currentHash, merkle_proofs[i])
        } else {
            (merkle_proofs[i], currentHash)
        };
        currentHash = poseidon2::Poseidon2::hash([left, right], 2)
    }
    currentHash
}
