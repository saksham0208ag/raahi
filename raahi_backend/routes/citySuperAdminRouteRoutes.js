const express = require("express");
const CityRoute = require("../models/CityRoute");

const router = express.Router();

const isCitySuperAdmin = (req) => {
  const key = String(req.headers["x-city-super-admin-key"] || req.query.citySuperAdminKey || "").trim();
  const expectedKey = String(process.env.CITY_SUPER_ADMIN_KEY || "").trim();
  if (!expectedKey) return false;
  return key === expectedKey;
};

router.use((req, res, next) => {
  if (!isCitySuperAdmin(req)) {
    return res.status(403).json({ error: "City super admin access required" });
  }
  return next();
});

const toStopsArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((x) => String(x || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
};

router.get("/auth/validate", (_req, res) => {
  return res.json({ ok: true });
});

router.get("/", async (req, res) => {
  try {
    const organizationCode = String(req.query.organizationCode || "").trim().toLowerCase();
    const routes = await CityRoute.find(organizationCode ? { organizationCode } : {})
      .sort({ createdAt: -1 })
      .limit(500);
    return res.json(routes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const routeName = String(req.body.routeName || "").trim();
    const startPoint = String(req.body.startPoint || "").trim();
    const endPoint = String(req.body.endPoint || "").trim();
    const organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();
    const stops = toStopsArray(req.body.stops);
    if (!routeName || !startPoint || !endPoint) {
      return res.status(400).json({ error: "routeName, startPoint and endPoint are required" });
    }

    const route = await CityRoute.create({
      organizationCode,
      routeName,
      startPoint,
      endPoint,
      stops
    });
    return res.status(201).json(route);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = {};
    if (req.body.routeName !== undefined) updates.routeName = String(req.body.routeName || "").trim();
    if (req.body.startPoint !== undefined) updates.startPoint = String(req.body.startPoint || "").trim();
    if (req.body.endPoint !== undefined) updates.endPoint = String(req.body.endPoint || "").trim();
    if (req.body.stops !== undefined) updates.stops = toStopsArray(req.body.stops);
    if (req.body.organizationCode !== undefined) {
      updates.organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();
    }

    const route = await CityRoute.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!route) return res.status(404).json({ error: "Route not found" });
    return res.json(route);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CityRoute.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Route not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
