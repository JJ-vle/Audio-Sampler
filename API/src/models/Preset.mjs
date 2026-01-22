import mongoose from "mongoose";

const SampleSchema = new mongoose.Schema({
  url: String,
  name: String
}, { _id: false });

const PresetSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, index: true },
  type: String,
  isFactoryPresets: Boolean,
  samples: [SampleSchema],
  updatedAt: String
});

export const Preset = mongoose.model("Preset", PresetSchema);
