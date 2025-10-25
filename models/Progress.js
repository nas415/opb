import mongoose from "mongoose";

const CardEntrySchema = new mongoose.Schema({
  cardId: { type: String },
  count: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  cards: { type: Map, of: Object, default: {} },
});

export default mongoose.models.Progress || mongoose.model("Progress", ProgressSchema);
