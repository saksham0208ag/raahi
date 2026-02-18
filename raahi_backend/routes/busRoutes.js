const express = require("express");
const router = express.Router();
const Bus = require("../models/Bus");

// 🔹 ADD A NEW BUS (City or Institution)
router.post("/add", async (req, res) => {
  try {
    const {
      busNumber,
      capacity,
      type,
      institutionName,
      route,
      status
    } = req.body;

    const bus = new Bus({
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
    const buses = await Bus.find().populate("route");
    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET INSTITUTION BUSES
router.get("/institution/:name", async (req, res) => {
  try {
    const buses = await Bus.find({
      type: "INSTITUTION",
      institutionName: req.params.name
    }).populate("route");

    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  GET CITY BUSES
router.get("/city/:city", async (req, res) => {
  try {
    const buses = await Bus.find({
      type: "CITY"
    }).populate("route");

    res.json(buses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ASSIGN-ROUTE TO BUSES
router.put("/assign-route", async (req, res) => {
  try {
    const { busId, routeId } = req.body;

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { route: routeId },
      { new: true }
    ).populate("route");

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
