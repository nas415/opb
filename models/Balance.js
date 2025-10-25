import mongoose from "mongoose";

const BalanceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  amount: { type: Number, default: 500 },
  resetTokens: { type: Number, default: 5 },
});

export default mongoose.models.Balance || mongoose.model("Balance", BalanceSchema);
