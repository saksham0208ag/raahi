const express = require("express");
const router = express.Router();
const LocationLog = require("../models/LocationLog");

// UPDATE BUS LOCATION (GPS HEARTBEAT)
router.post("/update", async (req, res) => {
  console.log("🔥 LOCATION HIT RECEIVED 🔥");
  console.log(req.body);

  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const location = new LocationLog({
      bus: busId,
      latitude,
      longitude
    });

    await location.save();

    res.json({ message: "Location updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// FETCH LIVE LOCATION
router.get("/live/:busId", async (req, res) => {
  try {
    const { busId } = req.params;

    const latestLocation = await LocationLog
      .findOne({ bus: busId })
      .sort({ timestamp: -1 });

    if (!latestLocation) {
      return res.status(404).json({
        message: "No location data found for this bus"
      });
    }

    res.json({
      busId,
      latitude: latestLocation.latitude,
      longitude: latestLocation.longitude,
      timestamp: latestLocation.timestamp
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
