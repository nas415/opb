import mongoose from "mongoose";

const PullSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  window: { type: Number, required: true },
  used: { type: Number, default: 0 },
});

export default mongoose.models.Pull || mongoose.model("Pull", PullSchema);
