function randomBytes32() {
  const array = new Uint8Array(32); // Allocate 32 bytes
  window.crypto.getRandomValues(array); // Fill with cryptographically secure random values
  return array;
}

export { randomBytes32 };
