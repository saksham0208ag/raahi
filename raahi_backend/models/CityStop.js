const mongoose = require("mongoose");
const { getCityDbConnection } = require("../config/cityDb");

const cityStopSchema = new mongoose.Schema(
  {
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
    organizationCode: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
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

cityStopSchema.index({ location: "2dsphere" });
cityStopSchema.index({ organizationCode: 1, name: 1 });

const cityDb = getCityDbConnection();
module.exports = cityDb.models.CityStop || cityDb.model("CityStop", cityStopSchema);
