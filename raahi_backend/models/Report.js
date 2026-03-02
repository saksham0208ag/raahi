const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Passenger",
      required: true
    },
    busId: {
      type: String,
      default: ""
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      default: ""
    },
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
