const mongoose = require("mongoose");

const stopSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    city: {
      type: String,
      trim: true,
      default: ""
    },
    aliases: {
      type: [String],
      default: []
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point"
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator(value) {
            return Array.isArray(value) && value.length === 2;
          },
          message: "location.coordinates must be [longitude, latitude]"
        }
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

stopSchema.index({ location: "2dsphere" });
stopSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model("Stop", stopSchema);
