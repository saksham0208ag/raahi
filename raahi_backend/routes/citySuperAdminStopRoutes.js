const express = require("express");
const CityStop = require("../models/CityStop");

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

    const query = {
      ...(organizationCode ? { organizationCode } : {}),
      ...(city ? { city: new RegExp(city, "i") } : {})
    };

    if (q) {
      query.$or = [{ name: new RegExp(q, "i") }, { aliases: new RegExp(q, "i") }];
    }

    const stops = await CityStop.find(query).sort({ createdAt: -1 }).limit(500);
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
    const organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();

    if (!name || !location) {
      return res.status(400).json({ error: "name, latitude and longitude are required" });
    }

    const stop = await CityStop.create({
      name,
      city,
      aliases,
      organizationCode,
      location,
      isActive: req.body.isActive !== false
    });

    return res.status(201).json(stop);
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
      updates.organizationCode = String(req.body.organizationCode || "").trim().toLowerCase();
    }

    const stop = await CityStop.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    });
    if (!stop) return res.status(404).json({ error: "Stop not found" });
    return res.json(stop);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CityStop.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Stop not found" });
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
