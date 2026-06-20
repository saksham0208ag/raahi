const mongoose = require("mongoose");
const { getCityDbConnection } = require("../config/cityDb");

const cityRouteSchema = new mongoose.Schema(
  {
    organizationCode: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    routeName: {
      type: String,
      required: true,
      trim: true
    },
    startPoint: {
      type: String,
      required: true,
      trim: true
    },
    endPoint: {
      type: String,
      required: true,
      trim: true
    },
    stops: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { timestamps: true }
);

cityRouteSchema.index({ organizationCode: 1, routeName: 1 }, { unique: true });

const cityDb = getCityDbConnection();
module.exports = cityDb.models.CityRoute || cityDb.model("CityRoute", cityRouteSchema);
