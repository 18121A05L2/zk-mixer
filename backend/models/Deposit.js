var mongoose = require("mongoose");

const DepositSchema = new mongoose.Schema({
  commitment: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, unique: true },
});

module.exports = mongoose.model("Deposit", DepositSchema);
