const express = require("express");
const router = express.Router();
const Bus = require("../models/Bus");
const { requireOrganization } = require("../middleware/organizationContext");
const { checkPlanLimit } = require("../utils/planGuard");

router.use(requireOrganization);

// 🔹 ADD A NEW BUS (City or Institution)
router.post("/add", async (req, res) => {
  try {
    const limitCheck = await checkPlanLimit({
      organizationId: req.organizationId,
      plan: req.organization?.plan,
      resource: "buses"
    });
    if (!limitCheck.allowed) {
      return res.status(403).json({ error: limitCheck.reason, code: "PLAN_LIMIT_REACHED" });
    }

    const {
      busNumber,
      capacity,
      type,
      institutionName,
      route,
      status
    } = req.body;

    const bus = new Bus({
      organizationId: req.organizationId,
      busNumber,
      capacity,
      type,        
      institutionName,   
      route,
      status: status || "running"
    });

    await bus.save();

    res.status(201).json({
      message: "Bus added successfully!",
      bus
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//  GET ALL BUSES (ADMIN / TESTING)
router.get("/", async (req, res) => {
  try {
    const buses = await Bus.find({ organizationId: req.organizationId }).populate("route driver");
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET INSTITUTION BUSES
router.get("/institution/:name", async (req, res) => {
  try {
    const buses = await Bus.find({
      organizationId: req.organizationId,
      type: "INSTITUTION",
      institutionName: req.params.name
    }).populate("route driver");

    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  GET CITY BUSES
router.get("/city/:city", async (req, res) => {
  try {
    const buses = await Bus.find({
      organizationId: req.organizationId,
      type: "CITY"
    }).populate("route driver");

    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ASSIGN-ROUTE TO BUSES
router.put("/assign-route", async (req, res) => {
  try {
    const { busId, routeId } = req.body;

    const bus = await Bus.findOneAndUpdate(
      { _id: busId, organizationId: req.organizationId },
      { route: routeId },
      { new: true }
    ).populate("route driver");

    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    res.json({
      message: "Route assigned to bus successfully",
      bus
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
