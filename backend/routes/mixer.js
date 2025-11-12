var express = require("express");
var Deposit = require("../models/Deposit.js");

const router = express.Router();

// POST /api/deposit - store a new hash
router.post("/api/deposit", async (req, res) => {
  try {
    const { commitment } = req.body;
    const deposit = new Deposit({ commitment });
    await deposit.save();
    res.status(201).json({ message: "Deposit stored successfully", deposit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store deposit" });
  }
});

// GET /api/deposit - fetch all deposits (sorted by index)
router.get("/api/withdraw", async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ timestamp: 1 });
    res.json(deposits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch deposits" });
  }
});

module.exports = router;
