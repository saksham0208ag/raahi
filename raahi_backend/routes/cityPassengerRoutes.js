const express = require("express");
const crypto = require("crypto");
const Passenger = require("../models/Passenger");
const Gaurdian = require("../models/Gaurdian");
const Route = require("../models/Route");
const Bus = require("../models/Bus");
const Stop = require("../models/Stop");
const CityPassengerAccount = require("../models/CityPassengerAccount");

const router = express.Router();

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");

const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const hashPin = (pin) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(pin), salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPin = (pin, encoded) => {
  const [salt, savedHash] = String(encoded || "").split(":");
  if (!salt || !savedHash) return false;
  const currentHash = crypto.scryptSync(String(pin), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(savedHash, "hex"), Buffer.from(currentHash, "hex"));
};

const extractRouteStops = (route) => {
  const fromStops = Array.isArray(route?.stops) ? route.stops : [];
  const names = [
    route?.startPoint,
    ...fromStops.map((s) => (typeof s === "string" ? s : s?.name || "")),
    route?.endPoint
  ]
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  return [...new Set(names)];
};

const levenshtein = (a, b) => {
  const aa = normalizeText(a);
  const bb = normalizeText(b);
  const matrix = Array.from({ length: aa.length + 1 }, () => new Array(bb.length + 1).fill(0));
  for (let i = 0; i <= aa.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= bb.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= aa.length; i += 1) {
    for (let j = 1; j <= bb.length; j += 1) {
      const cost = aa[i - 1] === bb[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[aa.length][bb.length];
};

const scoreStopName = (inputStop, candidateStop) => {
  const input = normalizeText(inputStop);
  const candidate = normalizeText(candidateStop);
  if (!input || !candidate) return 0;
  if (input === candidate) return 1;
  if (candidate.includes(input) || input.includes(candidate)) return 0.92;

  const inputWords = new Set(input.split(" ").filter(Boolean));
  const candidateWords = new Set(candidate.split(" ").filter(Boolean));
  const union = new Set([...inputWords, ...candidateWords]).size || 1;
  const overlap = [...inputWords].filter((w) => candidateWords.has(w)).length;
  const jaccard = overlap / union;

  const distance = levenshtein(input, candidate);
  const maxLen = Math.max(input.length, candidate.length) || 1;
  const editScore = 1 - distance / maxLen;

  return Math.max(jaccard * 0.8 + editScore * 0.2, 0);
};

const withOrgScope = (organizationId, query = {}) =>
  organizationId ? { ...query, organizationId } : query;

const hasActiveBusForStop = async ({ organizationId, stopName }) => {
  const normalizedStop = normalizeText(stopName);
  if (!normalizedStop) return false;

  const routes = await Route.find(withOrgScope(organizationId)).lean();
  const buses = await Bus.find({
    ...withOrgScope(organizationId),
    route: { $exists: true, $ne: null },
    status: { $in: ["running", "active"] }
  })
    .select("route")
    .lean();

  const activeRouteIds = new Set(buses.map((b) => String(b.route)).filter(Boolean));
  if (!activeRouteIds.size) return false;

  return routes.some((route) => {
    if (!activeRouteIds.has(String(route._id))) return false;
    return extractRouteStops(route).some((s) => normalizeText(s) === normalizedStop);
  });
};

const findBestBusForStop = async ({ organizationId, stopName }) => {
  const routes = await Route.find(withOrgScope(organizationId)).lean();
  let buses = await Bus.find({
    ...withOrgScope(organizationId),
    route: { $exists: true, $ne: null },
    type: "CITY",
    status: { $in: ["running", "active"] }
  })
    .populate("route")
    .lean();

  if (!buses.length) {
    buses = await Bus.find({
      ...withOrgScope(organizationId),
      route: { $exists: true, $ne: null },
      status: { $in: ["running", "active"] }
    })
      .populate("route")
      .lean();
  }

  if (!buses.length) {
    return { found: false, reason: "NO_ACTIVE_BUS" };
  }

  const busByRouteId = new Map();
  buses.forEach((bus) => {
    if (bus.route?._id) {
      busByRouteId.set(String(bus.route._id), bus);
    }
  });

  const directRoute = routes.find((route) => {
    const routeStops = extractRouteStops(route);
    return routeStops.some((s) => normalizeText(s) === normalizeText(stopName));
  });

  if (directRoute) {
    const directBus = busByRouteId.get(String(directRoute._id));
    if (directBus) {
      return {
        found: true,
        route: directRoute,
        bus: directBus,
        selectedStopName: stopName,
        matchType: "direct",
        suggestions: []
      };
    }
  }

  let best = null;
  const suggestions = [];

  routes.forEach((route) => {
    const bus = busByRouteId.get(String(route._id));
    if (!bus) return;
    const routeStops = extractRouteStops(route);
    routeStops.forEach((candidateStop) => {
      const score = scoreStopName(stopName, candidateStop);
      suggestions.push({
        routeId: route._id,
        routeName: route.routeName,
        busId: bus._id,
        busNumber: bus.busNumber,
        stopName: candidateStop,
        score: Number(score.toFixed(3))
      });
      if (!best || score > best.score) {
        best = { route, bus, candidateStop, score };
      }
    });
  });

  const topSuggestions = suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!best || best.score < 0.35) {
    return {
      found: false,
      reason: "NO_MATCHED_STOP",
      suggestions: topSuggestions
    };
  }

  return {
    found: true,
    route: best.route,
    bus: best.bus,
    selectedStopName: best.candidateStop,
    matchType: "nearest",
    score: Number(best.score.toFixed(3)),
    suggestions: topSuggestions
  };
};

const findJourneyOptions = async ({ organizationId, fromStop, toStop }) => {
  const routes = await Route.find(withOrgScope(organizationId)).lean();
  let buses = await Bus.find({
    ...withOrgScope(organizationId),
    route: { $exists: true, $ne: null },
    type: "CITY",
    status: { $in: ["running", "active"] }
  })
    .populate("route")
    .lean();

  if (!buses.length) {
    buses = await Bus.find({
      ...withOrgScope(organizationId),
      route: { $exists: true, $ne: null },
      status: { $in: ["running", "active"] }
    })
      .populate("route")
      .lean();
  }

  const busByRouteId = new Map();
  buses.forEach((bus) => {
    if (bus.route?._id) busByRouteId.set(String(bus.route._id), bus);
  });

  const options = [];
  routes.forEach((route) => {
    const bus = busByRouteId.get(String(route._id));
    if (!bus) return;
    const routeStops = extractRouteStops(route);
    if (!routeStops.length) return;

    let bestFrom = { stop: "", score: 0 };
    let bestTo = { stop: "", score: 0 };
    routeStops.forEach((stop) => {
      const fromScore = scoreStopName(fromStop, stop);
      const toScore = scoreStopName(toStop, stop);
      if (fromScore > bestFrom.score) bestFrom = { stop, score: fromScore };
      if (toScore > bestTo.score) bestTo = { stop, score: toScore };
    });

    if (bestFrom.score < 0.35 || bestTo.score < 0.35 || normalizeText(bestFrom.stop) === normalizeText(bestTo.stop)) {
      return;
    }

    const totalScore = Number((((bestFrom.score + bestTo.score) / 2) * 100).toFixed(1));
    options.push({
      routeId: route._id,
      routeName: route.routeName,
      busId: bus._id,
      busNumber: bus.busNumber,
      fromStopMatched: bestFrom.stop,
      toStopMatched: bestTo.stop,
      confidence: totalScore
    });
  });

  return options.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
};

const toPassengerDetails = (passenger) => ({
  id: passenger._id,
  name: passenger.name || "",
  passengerType: passenger.passengerType || "city",
  phone: passenger.phone || "",
  rollNo: passenger.rollNo || "",
  stopName: passenger.stopName || "",
  destinationStop: passenger.destinationStop || "",
  status: passenger.status || "active",
  busId: passenger.bus?._id || null,
  busNumber: passenger.bus?.busNumber || "",
  routeId: passenger.route?._id || null,
  routeName: passenger.route?.routeName || "",
  routeStartPoint: passenger.route?.startPoint || "",
  routeEndPoint: passenger.route?.endPoint || "",
  routeStops: Array.isArray(passenger.route?.stops)
    ? passenger.route.stops.map((s) => (typeof s === "string" ? s : s?.name || "")).filter(Boolean)
    : [],
  guardianName: passenger.gaurdian?.name || "",
  guardianPhone: passenger.gaurdian?.phone || "",
  guardianEmail: passenger.gaurdian?.email || "",
  guardianRelation: passenger.gaurdian?.relation || ""
});

router.get("/stops/suggest", async (req, res) => {
  try {
    const stopName = String(req.query.pickupStop || req.query.stopName || "").trim();
    if (!stopName) {
      return res.status(400).json({ error: "pickupStop is required" });
    }
    const result = await findBestBusForStop({ organizationId: req.organizationId, stopName });
    if (!result.found) {
      return res.status(404).json({
        error: "No active bus found for this stop",
        reason: result.reason,
        suggestions: result.suggestions || []
      });
    }
    res.json({
      requestedPickupStop: stopName,
      selectedStopName: result.selectedStopName,
      matchType: result.matchType,
      confidenceScore: result.score || 1,
      bus: { id: result.bus._id, busNumber: result.bus.busNumber },
      route: { id: result.route._id, routeName: result.route.routeName },
      suggestions: result.suggestions || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/auth/register-or-login", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const pin = String(req.body.pin || "").trim();

    if (!phone || !pin) {
      return res.status(400).json({ error: "phone and pin are required" });
    }

    const existingAccount = await CityPassengerAccount.findOne({
      phone
    });

    if (existingAccount) {
      if (!verifyPin(pin, existingAccount.pinHash)) {
        return res.status(401).json({ error: "Invalid PIN" });
      }

      const passenger = await Passenger.findOne({
        _id: existingAccount.passengerId
      })
        .populate("gaurdian bus route");

      if (!passenger) {
        return res.status(404).json({ error: "Passenger profile not found for this account" });
      }

      if (req.body.name) {
        passenger.name = String(req.body.name).trim();
      }
      await passenger.save();

      if (passenger.gaurdian && (req.body.gaurdianName || req.body.gaurdianPhone || req.body.gaurdianEmail)) {
        await Gaurdian.findByIdAndUpdate(
          passenger.gaurdian,
          {
            name: String(req.body.gaurdianName || "").trim() || passenger.gaurdian.name,
            phone: String(req.body.gaurdianPhone || "").trim() || passenger.gaurdian.phone,
            email: String(req.body.gaurdianEmail || "").trim().toLowerCase() || passenger.gaurdian.email,
            relation: String(req.body.gaurdianRelation || "").trim() || passenger.gaurdian.relation || ""
          },
          { new: true, runValidators: true }
        );
      }

      const updatedPassenger = await Passenger.findById(passenger._id).populate("gaurdian bus route");
      return res.json({
        created: false,
        message: "Login successful",
        matchType: "current",
        selectedStopName: updatedPassenger.stopName || "",
        suggestions: [],
        passengerId: updatedPassenger._id,
        busId: updatedPassenger.bus?._id || null,
        passengerDetails: toPassengerDetails(updatedPassenger)
      });
    }

    const name = String(req.body.name || "").trim();
    const gaurdianName = String(req.body.gaurdianName || "").trim();
    const gaurdianPhone = String(req.body.gaurdianPhone || "").trim();
    const gaurdianEmailRaw = String(req.body.gaurdianEmail || "").trim().toLowerCase();
    const gaurdianEmail = gaurdianEmailRaw || `guardian-${phone}@raahi.local`;
    const gaurdianRelation = String(req.body.gaurdianRelation || "").trim();

    if (!name || !gaurdianName || !gaurdianPhone) {
      return res.status(400).json({
        error: "name, gaurdianName and gaurdianPhone are required for new city passengers"
      });
    }
    const scopedOrganizationId = req.organizationId || null;

    const gaurdian = await Gaurdian.create({
      organizationId: scopedOrganizationId,
      name: gaurdianName,
      phone: gaurdianPhone,
      email: gaurdianEmail,
      relation: gaurdianRelation
    });

    const passenger = await Passenger.create({
      organizationId: scopedOrganizationId,
      passengerType: "city",
      name,
      phone,
      stopName: "",
      destinationStop: "",
      gaurdian: gaurdian._id,
      status: "active"
    });

    await CityPassengerAccount.create({
      organizationId: scopedOrganizationId,
      passengerId: passenger._id,
      phone,
      pinHash: hashPin(pin)
    });

    const savedPassenger = await Passenger.findById(passenger._id).populate("gaurdian bus route");
    return res.status(201).json({
      created: true,
      message: "City passenger account created",
      matchType: "none",
      selectedStopName: "",
      suggestions: [],
      passengerId: savedPassenger._id,
      busId: savedPassenger.bus?._id || null,
      passengerDetails: toPassengerDetails(savedPassenger)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/journey/search", async (req, res) => {
  try {
    const passengerId = String(req.body.passengerId || "").trim();
    const fromStop = String(req.body.fromStop || "").trim();
    const toStop = String(req.body.toStop || "").trim();

    if (!passengerId || !fromStop || !toStop) {
      return res.status(400).json({ error: "passengerId, fromStop and toStop are required" });
    }

    const passenger = await Passenger.findById(passengerId);
    if (!passenger || passenger.passengerType !== "city") {
      return res.status(404).json({ error: "City passenger not found" });
    }

    const options = await findJourneyOptions({
      organizationId: passenger.organizationId || null,
      fromStop,
      toStop
    });

    if (!options.length) {
      return res.status(404).json({
        error: "No bus route found for this journey",
        options: []
      });
    }

    return res.json({ options });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/journey/nearest-stops", async (req, res) => {
  try {
    const lat = Number(req.body.latitude);
    const lng = Number(req.body.longitude);
    const limit = Math.min(10, Math.max(1, Number(req.body.limit || 5)));
    const maxDistanceKm = Math.min(20, Math.max(1, Number(req.body.maxDistanceKm || 5)));
    const passengerId = String(req.body.passengerId || "").trim();

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: "Valid latitude and longitude are required" });
    }

    let organizationId = null;
    if (passengerId) {
      const passenger = await Passenger.findById(passengerId).select("organizationId passengerType");
      if (passenger && passenger.passengerType === "city") {
        organizationId = passenger.organizationId || null;
      }
    }

    const candidates = await Stop.find({
      ...withOrgScope(organizationId),
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: Math.round(maxDistanceKm * 1000)
        }
      }
    }).limit(30);

    const nearestStops = [];
    for (const stop of candidates) {
      const served = await hasActiveBusForStop({
        organizationId: stop.organizationId || organizationId || null,
        stopName: stop.name
      });
      if (!served) continue;
      const stopLat = Number(stop.location?.coordinates?.[1]);
      const stopLng = Number(stop.location?.coordinates?.[0]);
      const approxDistanceKm =
        Number.isFinite(stopLat) && Number.isFinite(stopLng)
          ? Number(
              (
                Math.acos(
                  Math.sin((lat * Math.PI) / 180) * Math.sin((stopLat * Math.PI) / 180) +
                    Math.cos((lat * Math.PI) / 180) *
                      Math.cos((stopLat * Math.PI) / 180) *
                      Math.cos(((stopLng - lng) * Math.PI) / 180)
                ) * 6371
              ).toFixed(2)
            )
          : null;

      nearestStops.push({
        id: stop._id,
        name: stop.name,
        city: stop.city || "",
        latitude: stopLat,
        longitude: stopLng,
        distanceKm: approxDistanceKm
      });
      if (nearestStops.length >= limit) break;
    }

    return res.json({ nearestStops });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post("/journey/select", async (req, res) => {
  try {
    const passengerId = String(req.body.passengerId || "").trim();
    const routeId = String(req.body.routeId || "").trim();
    const busId = String(req.body.busId || "").trim();
    const fromStopMatched = String(req.body.fromStopMatched || req.body.fromStop || "").trim();
    const toStopMatched = String(req.body.toStopMatched || req.body.toStop || "").trim();

    if (!passengerId || !routeId || !busId || !fromStopMatched || !toStopMatched) {
      return res.status(400).json({ error: "passengerId, routeId, busId, fromStopMatched and toStopMatched are required" });
    }

    const passenger = await Passenger.findById(passengerId);
    if (!passenger || passenger.passengerType !== "city") {
      return res.status(404).json({ error: "City passenger not found" });
    }

    const route = await Route.findById(routeId);
    const bus = await Bus.findById(busId);
    if (!route || !bus || String(bus.route || "") !== String(route._id)) {
      return res.status(400).json({ error: "Invalid journey selection" });
    }

    passenger.stopName = fromStopMatched;
    passenger.destinationStop = toStopMatched;
    passenger.route = route._id;
    passenger.bus = bus._id;
    if (!passenger.organizationId && route.organizationId) {
      passenger.organizationId = route.organizationId;
    }
    await passenger.save();

    const updatedPassenger = await Passenger.findById(passenger._id).populate("gaurdian bus route");
    return res.json({
      message: "Journey selected",
      passengerId: updatedPassenger._id,
      busId: updatedPassenger.bus?._id || null,
      passengerDetails: toPassengerDetails(updatedPassenger)
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;
