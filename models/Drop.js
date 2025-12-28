import mongoose from "mongoose";

const DropSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  intervalMs: { type: Number, default: 5 * 60 * 1000 }, // default 5 minutes
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Drop || mongoose.model("Drop", DropSchema);
