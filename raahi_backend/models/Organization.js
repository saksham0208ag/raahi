const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    plan: {
      type: String,
      enum: ["trial", "basic", "pro", "enterprise"],
      default: "trial"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    trialEndsAt: {
      type: Date,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    subscriptionEndsAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Organization", organizationSchema);
