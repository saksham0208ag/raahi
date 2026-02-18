const mongoose = require("mongoose");

const sosSchema = new mongoose.Schema({
  passengerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Passenger",
    required: true
  },
  busId: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: "Bus",
    type:String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  time:{
    type:Date,
default:Date.now
  },
  triggeredAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("SOS", sosSchema);
