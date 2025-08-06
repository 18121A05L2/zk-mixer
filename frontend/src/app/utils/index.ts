function randomBytes32() {
  const array = new Uint8Array(32); // Allocate 32 bytes
  window.crypto.getRandomValues(array); // Fill with cryptographically secure random values
  return array;
}

// taken from @aztec/bb.js/proof
function uint8ArrayToHex(buffer: Uint8Array): string {
  const hex: string[] = [];

  buffer.forEach(function (i) {
    let h = i.toString(16);
    if (h.length % 2) {
      h = "0" + h;
    }
    hex.push(h);
  });

  return hex.join("");
}

export { randomBytes32, uint8ArrayToHex };
