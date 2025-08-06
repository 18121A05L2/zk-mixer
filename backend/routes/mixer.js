var express = require("express");
var router = express.Router();
const { Fr, Barretenberg } = require("@aztec/bb.js");

router.get("/leaves", async function (req, res, next) {
  res.send([
    "0x2a2f73526fcedf30b91bca5827679ce48d024753b2ca06217b99479c8f9911c1",
    "0x22b32ba4fdaddc6c212496febb78575d054ace0985a130df298c953634d2a803",
    "0x079cd038fb75ec74807b3efadefbd486c26c4707aff68b67261cbd795bb1fa3b",
    "0x0acf7635d83ae55448dd29af15a69364320f30bd853a4d6b20a05304d706bb32",
    "0x03f9e89ac3c5743507a37b33a7139eadb9b85815b815692d986ee57ee7557c14",
    "0x1a800b94519f17f22091ea1e84c6a23a1fba40808bbd3762b079ad0a4bac20ba",
  ]);
});

module.exports = router;
