const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const Bus = require("../models/Bus");
const Passenger = require("../models/Passenger");

const defaultStops = [
  "Main Gate",
  "City Center",
  "Railway Station",
  "Bus Stand",
  "Market Chowk"
];

// ADD A NEW ROUTE
router.post("/add", async (req, res) => {
  try {
    const { routeName,startPoint,endPoint, stops, institutionName, city } = req.body;
    const normalizedStops = Array.isArray(stops)
      ? stops.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const route = new Route({
      routeName,
      startPoint,
      endPoint,
      stops: normalizedStops.length ? normalizedStops : defaultStops,
      institutionName,
      city
    });

    await route.save();

    res.status(201).json({
      message: "Route added successfully!",
      route
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ADD STOP TO EXISTING ROUTE
router.put("/:id/stops", async (req, res) => {
  try {
    const stopName = String(req.body.stopName || "").trim();
    if (!stopName) {
      return res.status(400).json({ error: "stopName is required" });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    const exists = (route.stops || []).some(
      (s) => String(s).toLowerCase() === stopName.toLowerCase()
    );

    if (!exists) {
      route.stops = [...(route.stops || []), stopName];
      await route.save();
    }

    res.json({
      message: exists ? "Stop already exists" : "Stop added successfully",
      route
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET ALL ROUTES
router.get("/", async (req, res) => {
  try {
    const routes = await Route.find();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ROUTE
router.delete("/:id", async (req, res) => {
  try {
    const routeId = req.params.id;

    const route = await Route.findById(routeId);
    if (!route) {
      return res.status(404).json({ error: "Route not found" });
    }

    // Unlink dependent records to avoid dangling references.
    const busUpdate = await Bus.updateMany({ route: routeId }, { $unset: { route: 1 } });
    const passengerUpdate = await Passenger.updateMany(
      { route: routeId },
      { $unset: { route: 1, bus: 1 } }
    );

    await Route.findByIdAndDelete(routeId);

    res.json({
      message: "Route deleted successfully",
      unlinkedBuses: busUpdate.modifiedCount || 0,
      unlinkedPassengers: passengerUpdate.modifiedCount || 0
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
