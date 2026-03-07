const express = require("express");
const Route = require("../models/Route");
const Organization = require("../models/Organization");

const router = express.Router();

const isSuperAdmin = (req) => {
  const key = String(req.headers["x-super-admin-key"] || req.query.superAdminKey || "").trim();
  return Boolean(key && process.env.SUPER_ADMIN_KEY && key === process.env.SUPER_ADMIN_KEY);
};

router.use((req, res, next) => {
  if (!isSuperAdmin(req)) {
    return res.status(403).json({ error: "Super admin access required" });
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

const resolveOrganizationId = async (organizationCode) => {
  const code = String(organizationCode || "").trim().toLowerCase();
  if (!code) return null;
  const org = await Organization.findOne({ code }).select("_id");
  if (!org) return undefined;
  return org._id;
};

router.get("/", async (req, res) => {
  try {
    const organizationCode = String(req.query.organizationCode || "").trim().toLowerCase();
    let organizationId = null;
    if (organizationCode) {
      organizationId = await resolveOrganizationId(organizationCode);
      if (organizationId === undefined) {
        return res.status(404).json({ error: "Organization not found for given organizationCode" });
      }
    }

    const routes = await Route.find(
      organizationCode ? { organizationId } : {}
    )
      .sort({ createdAt: -1 })
      .limit(500)
      .populate("organizationId", "name code");
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
    const stops = toStopsArray(req.body.stops);
    if (!routeName || !startPoint || !endPoint) {
      return res.status(400).json({ error: "routeName, startPoint and endPoint are required" });
    }

    const organizationId = await resolveOrganizationId(req.body.organizationCode);
    if (organizationId === undefined) {
      return res.status(404).json({ error: "Organization not found for given organizationCode" });
    }

    const route = await Route.create({
      organizationId: organizationId || null,
      routeName,
      startPoint,
      endPoint,
      stops
    });
    const populated = await Route.findById(route._id).populate("organizationId", "name code");
    return res.status(201).json(populated);
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
      const organizationId = await resolveOrganizationId(req.body.organizationCode);
      if (organizationId === undefined) {
        return res.status(404).json({ error: "Organization not found for given organizationCode" });
      }
      updates.organizationId = organizationId || null;
    }

    const route = await Route.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate("organizationId", "name code");
    if (!route) return res.status(404).json({ error: "Route not found" });
    return res.json(route);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Route.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Route not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
