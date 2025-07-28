var express = require("express");
var router = express.Router();
const { Fr, Barretenberg } = require("@aztec/bb.js");

router.get("/generateCommiment", async function (req, res, next) {
  const nullifier = Fr.random();
  const secret = Fr.random();
  const barratenberg = await Barretenberg.new();

  const commitment = await barratenberg.poseidon2Hash([nullifier, secret]);
  const output = {
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    commitment: commitment.toString(),
  };
  res.send(output);
});

router.get("/commitment", async function (req, res, next) {
  const nullifier = Fr.fromString(req.query.nullifier);
  const secret = Fr.fromString(req.query.secret);
  const barratenberg = await Barretenberg.new();
  const commitment = await barratenberg.poseidon2Hash([nullifier, secret]);
  const nullifierHash = await barratenberg.poseidon2Hash([nullifier]);
  const output = {
    commitment: commitment.toString(),
    nullifierHash: nullifierHash.toString(),
  };
  res.send(output);
});

router.get("/leaves", async function (req, res, next) {});

module.exports = router;
