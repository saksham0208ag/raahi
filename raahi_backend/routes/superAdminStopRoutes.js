const express = require("express");
const Stop = require("../models/Stop");
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

const parseLocation = (latitudeRaw, longitudeRaw) => {
  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { type: "Point", coordinates: [longitude, latitude] };
};

router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const city = String(req.query.city || "").trim();
    const organizationCode = String(req.query.organizationCode || "").trim().toLowerCase();

    let organizationId = null;
    if (organizationCode) {
      const org = await Organization.findOne({ code: organizationCode }).select("_id");
      if (!org) return res.status(404).json({ error: "Organization not found for given organizationCode" });
      organizationId = org._id;
    }

    const query = {
      ...(organizationId ? { organizationId } : {}),
      ...(city ? { city: new RegExp(city, "i") } : {})
    };

    if (q) {
      query.$or = [{ name: new RegExp(q, "i") }, { aliases: new RegExp(q, "i") }];
    }

    const stops = await Stop.find(query).sort({ createdAt: -1 }).limit(500).populate("organizationId", "name code");
    return res.json(stops);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const city = String(req.body.city || "").trim();
    const aliases = Array.isArray(req.body.aliases)
      ? req.body.aliases.map((x) => String(x || "").trim()).filter(Boolean)
      : String(req.body.aliases || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
    const location = parseLocation(req.body.latitude, req.body.longitude);

    if (!name || !location) {
      return res.status(400).json({ error: "name, latitude and longitude are required" });
    }

    let organizationId = null;
    const organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();
    if (organizationCode) {
      const org = await Organization.findOne({ code: organizationCode }).select("_id");
      if (!org) return res.status(404).json({ error: "Organization not found for given organizationCode" });
      organizationId = org._id;
    }

    const stop = await Stop.create({
      organizationId,
      name,
      city,
      aliases,
      location,
      isActive: req.body.isActive !== false
    });

    const populated = await Stop.findById(stop._id).populate("organizationId", "name code");
    return res.status(201).json(populated);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name || "").trim();
    if (req.body.city !== undefined) updates.city = String(req.body.city || "").trim();
    if (req.body.aliases !== undefined) {
      updates.aliases = Array.isArray(req.body.aliases)
        ? req.body.aliases.map((x) => String(x || "").trim()).filter(Boolean)
        : String(req.body.aliases || "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const hasLat = req.body.latitude !== undefined;
    const hasLng = req.body.longitude !== undefined;
    if (hasLat || hasLng) {
      const location = parseLocation(
        hasLat ? req.body.latitude : null,
        hasLng ? req.body.longitude : null
      );
      if (!location) {
        return res.status(400).json({ error: "Valid latitude and longitude are required together" });
      }
      updates.location = location;
    }

    if (req.body.organizationCode !== undefined) {
      const organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();
      if (!organizationCode) {
        updates.organizationId = null;
      } else {
        const org = await Organization.findOne({ code: organizationCode }).select("_id");
        if (!org) return res.status(404).json({ error: "Organization not found for given organizationCode" });
        updates.organizationId = org._id;
      }
    }

    const stop = await Stop.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).populate("organizationId", "name code");
    if (!stop) return res.status(404).json({ error: "Stop not found" });
    return res.json(stop);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Stop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Stop not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
