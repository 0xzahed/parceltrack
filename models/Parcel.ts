import mongoose, { Schema } from "mongoose";

const EventSchema = new Schema(
  { at: String, note: String },
  { _id: false },
);

const ParcelSchema = new Schema(
  {
    trackingId: { type: String, required: true },
    courier: { type: String, required: true },
    status: { type: String, default: "unknown" },
    summary: { type: String, default: "" },
    events: { type: [EventSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

ParcelSchema.index({ trackingId: 1, courier: 1 }, { unique: true });

export const Parcel = mongoose.models.Parcel ?? mongoose.model("Parcel", ParcelSchema);
