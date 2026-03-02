const express = require("express");
const router = express.Router();
const LocationLog = require("../models/LocationLog");
const Bus = require("../models/Bus");
const { requireOrganization } = require("../middleware/organizationContext");

router.use(requireOrganization);

// UPDATE BUS LOCATION (GPS HEARTBEAT)
router.post("/update", async (req, res) => {
  console.log("🔥 LOCATION HIT RECEIVED 🔥");
  console.log(req.body);

  try {
    const { busId, latitude, longitude } = req.body;

    if (!busId || !latitude || !longitude) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const bus = await Bus.findOne({ _id: busId, organizationId: req.organizationId });
    if (!bus) {
      return res.status(404).json({ message: "Bus not found for this organization" });
    }

    const location = new LocationLog({
      organizationId: req.organizationId,
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
      .findOne({ bus: busId, organizationId: req.organizationId })
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
