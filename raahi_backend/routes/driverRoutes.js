const express = require("express");
const router = express.Router();
const Driver = require("../models/Driver");
const Bus = require("../models/Bus");
const { requireOrganization } = require("../middleware/organizationContext");

router.use(requireOrganization);

router.get("/", async (req, res) => {
  try {
    const drivers = await Driver.find({ organizationId: req.organizationId })
      .populate("assignedBus")
      .sort({ createdAt: -1 });
    return res.json(drivers);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const phone = String(req.body.phone || "").trim();
    const licenseNumber = String(req.body.licenseNumber || "").trim();
    const driverCode = String(req.body.driverCode || "").trim().toLowerCase();

    if (!name || !phone || !licenseNumber || !driverCode) {
      return res.status(400).json({ error: "name, phone, licenseNumber and driverCode are required" });
    }

    const driver = await Driver.create({
      organizationId: req.organizationId,
      name,
      phone,
      licenseNumber,
      driverCode,
      status: req.body.status || "active"
    });

    return res.status(201).json(driver);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.put("/assign-bus", async (req, res) => {
  try {
    const { driverId, busId } = req.body;
    if (!driverId || !busId) {
      return res.status(400).json({ error: "driverId and busId are required" });
    }

    const driver = await Driver.findOne({
      _id: driverId,
      organizationId: req.organizationId
    });
    if (!driver) return res.status(404).json({ error: "Driver not found" });

    const bus = await Bus.findOne({
      _id: busId,
      organizationId: req.organizationId
    });
    if (!bus) return res.status(404).json({ error: "Bus not found" });

    if (driver.assignedBus && String(driver.assignedBus) !== String(busId)) {
      await Bus.findOneAndUpdate(
        { _id: driver.assignedBus, organizationId: req.organizationId },
        { $unset: { driver: 1 } }
      );
    }

    const previousDriverOnBus = await Driver.findOne({
      organizationId: req.organizationId,
      assignedBus: busId,
      _id: { $ne: driverId }
    });
    if (previousDriverOnBus) {
      previousDriverOnBus.assignedBus = undefined;
      await previousDriverOnBus.save();
    }

    driver.assignedBus = busId;
    await driver.save();
    bus.driver = driverId;
    await bus.save();

    const updated = await Driver.findById(driverId).populate("assignedBus");
    return res.json({
      message: "Bus assigned to driver successfully",
      driver: updated
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
