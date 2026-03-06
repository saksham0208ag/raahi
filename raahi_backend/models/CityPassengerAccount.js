const mongoose = require("mongoose");

const cityPassengerAccountSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true,
      unique: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    pinHash: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

cityPassengerAccountSchema.index({ organizationId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model("CityPassengerAccount", cityPassengerAccountSchema);
