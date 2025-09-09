import { Barretenberg, Fr } from "@aztec/bb.js";
let bb;

async function hashLeftRight(left, right) {
  if (!bb) {
    bb = await Barretenberg.new();
  }
  const frLeft = Fr.fromString(left);
  const frRight = Fr.fromString(right);
  const hash = await bb.poseidon2Hash([frLeft, frRight]);
  return hash.toString();
}

export class PoseidonTree {
  constructor(levels, zeros) {
    if (zeros.length < levels + 1) {
      throw new Error(
        "Not enough zero values provided for the given tree height."
      );
    }
    this.levels = levels;
    this.hashLeftRight = hashLeftRight;
    this.storage = new Map();
    this.zeros = zeros;
    this.totalLeaves = 0;
  }

  async init(defaultLeaves = []) {
    if (defaultLeaves.length > 0) {
      this.totalLeaves = defaultLeaves.length;

      defaultLeaves.forEach((leaf, index) => {
        this.storage.set(PoseidonTree.indexToKey(0, index), leaf);
      });

      for (let level = 1; level <= this.levels; level++) {
        const numNodes = Math.ceil(this.totalLeaves / 2 ** level);
        for (let i = 0; i < numNodes; i++) {
          const left =
            this.storage.get(PoseidonTree.indexToKey(level - 1, 2 * i)) ||
            this.zeros[level - 1];
          const right =
            this.storage.get(PoseidonTree.indexToKey(level - 1, 2 * i + 1)) ||
            this.zeros[level - 1];
          const node = await this.hashLeftRight(left, right);
          this.storage.set(PoseidonTree.indexToKey(level, i), node);
        }
      }
    }
  }

  static indexToKey(level, index) {
    return `${level}-${index}`;
  }

  getIndex(leaf) {
    for (const [key, value] of this.storage.entries()) {
      if (value === leaf && key.startsWith("0-")) {
        return parseInt(key.split("-")[1]);
      }
    }
    return -1;
  }

  root() {
    return (
      this.storage.get(PoseidonTree.indexToKey(this.levels, 0)) ||
      this.zeros[this.levels]
    );
  }

  proof(index) {
    const leaf = this.storage.get(PoseidonTree.indexToKey(0, index));
    if (!leaf) throw new Error("leaf not found");

    const pathElements = [];
    const pathIndices = [];

    this.traverse(index, (level, currentIndex, siblingIndex) => {
      const sibling =
        this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
        this.zeros[level];
      pathElements.push(sibling);
      pathIndices.push(currentIndex % 2);
    });

    return {
      root: this.root(),
      pathElements,
      pathIndices,
      leaf,
    };
  }

  async insert(leaf) {
    const index = this.totalLeaves;
    await this.update(index, leaf, true);
    this.totalLeaves++;
  }

  async update(index, newLeaf, isInsert = false) {
    if (!isInsert && index >= this.totalLeaves) {
      throw Error("Use insert method for new elements.");
    } else if (isInsert && index < this.totalLeaves) {
      throw Error("Use update method for existing elements.");
    }

    const keyValueToStore = [];
    let currentElement = newLeaf;

    await this.traverseAsync(
      index,
      async (level, currentIndex, siblingIndex) => {
        const sibling =
          this.storage.get(PoseidonTree.indexToKey(level, siblingIndex)) ||
          this.zeros[level];
        const [left, right] =
          currentIndex % 2 === 0
            ? [currentElement, sibling]
            : [sibling, currentElement];
        keyValueToStore.push({
          key: PoseidonTree.indexToKey(level, currentIndex),
          value: currentElement,
        });
        currentElement = await this.hashLeftRight(left, right);
      }
    );

    keyValueToStore.push({
      key: PoseidonTree.indexToKey(this.levels, 0),
      value: currentElement,
    });
    keyValueToStore.forEach(({ key, value }) => this.storage.set(key, value));
  }

  traverse(index, fn) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }

  async traverseAsync(index, fn) {
    let currentIndex = index;
    for (let level = 0; level < this.levels; level++) {
      const siblingIndex =
        currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      await fn(level, currentIndex, siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }
  }
}

const ZERO_VALUES = [
  "0x1345d529f819bf7001641d2aeb20a5b8ef59e711d1f6c06b218db95a5782a86e",
  "0x2575891611affb9b4b8ee8e1fcbd88e9971c23c647ce02f425f3c39187436f83",
  "0x22ab4899b4b6afdd318dd19fe23295d35c4625b68d17c4e49720233f00948e8d",
  "0x1bb74cc2957327dfad5f1daffb16c666535d6c0ac1707e116e4639475b9a3255",
  "0x25ef148c61128edbd79c327f5e4238c6d1d374f3483d3fed583b34d94caa454d",
  "0x2c8ab26b7cb21fdf2d80a45645734f026c96835f38cda1509fa4dcc6c6d18280",
  "0x0bbc7377980389e13ac415a620332352e4923554511f2e5efde2a292183589ac",
  "0x2250e419c9291056ae9dbc11adcf0be56cd7fa1beab83298eddcf5d167312652",
  "0x2f81f8bd2fbf6c57d150a481e15dccdaa449bef9c3248dba86f82581bad0b5af",
  "0x2efef55ccdf5932404db96007befdd1f316147bc57166161fc12495e75a70bc5",
  "0x2563b416c20155c723eb689265475716f4d923b3eec84c7c58a103c6fbaad9de",
  "0x0448a4740fb73c75df3146234a7736768ebdceab4ab50ec1358cf5e4766634e2",
  "0x0327b2fa19c0394893f6247e3c7bf90048e9eb1169c78b760ac0ff37e010192d",
  "0x284ef67857a2885c5131620039e5fa10f6ceb2874866c97d721af35e305cdd35",
  "0x2141346c13dc0e8babed8577c075b0e03d8df35cd9abcc512b7c911e3a51d657",
  "0x14d3376b456770b960ee8ba957dbc31697213f19406b248ec8a393a35770b10c",
  "0x2c26855bf3aaa57d14b2b1bb3f6d270524bcfa16c1ffdbe4b52508da1c72890e",
  "0x19e30204d41ba0861b4d4410b6f272b23943b57be4ee208208ef56e76e7655e2",
  "0x157aed3bfc38346bc39ca67ba197b32ab19e743f6669b1da4d2b8b85c5ae2ada",
  "0x1540940da8def917d70529b57e56ab4f463a0328ff19899746c510b7ba0eef12",
  "0x1a0ebe8a927594dcf8c021852ac6866cb8fd94e4a100a7fb3ffdfe0eea396530",
];

export async function merkleTree(leaves) {
  const TREE_HEIGHT = 20;
  const tree = new PoseidonTree(TREE_HEIGHT, ZERO_VALUES);

  // Initialize tree with no leaves (all zeros)
  await tree.init();

  // Insert some leaves (from input)
  for (const leaf of leaves) {
    await tree.insert(leaf);
  }

  return tree;
}
