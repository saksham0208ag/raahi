const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const Passenger = require("../models/Passenger");
const { requireOrganization } = require("../middleware/organizationContext");

router.use(requireOrganization);

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const cleanupOldReports = async () => {
  const cutoff = new Date(Date.now() - ONE_YEAR_MS);
  await Report.deleteMany({ reportedAt: { $lt: cutoff } });
};

const getRangeStartDate = (range) => {
  const now = Date.now();
  switch (range) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "1w":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "1m":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now - ONE_YEAR_MS);
    default:
      return new Date(now - 24 * 60 * 60 * 1000);
  }
};

const buildLocationLink = (latitude, longitude) =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

router.post("/", async (req, res) => {
  try {
    await cleanupOldReports();
    const { passengerId, busId, category, message, latitude, longitude, reportedAt } = req.body;

    if (!passengerId) {
      return res.status(400).json({ success: false, error: "passengerId is required" });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ success: false, error: "category is required" });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ success: false, error: "Valid latitude and longitude are required" });
    }

    const passenger = await Passenger.findOne({
      _id: passengerId,
      organizationId: req.organizationId
    });
    if (!passenger) {
      return res.status(404).json({ success: false, error: "Passenger not found" });
    }

    const report = new Report({
      organizationId: req.organizationId,
      passengerId,
      busId: String(passenger.bus || busId || ""),
      category: String(category).trim(),
      message: String(message || "").trim(),
      latitude,
      longitude,
      reportedAt: reportedAt ? new Date(reportedAt) : new Date()
    });

    await report.save();
    return res.status(201).json({ success: true, reportId: report._id });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    await cleanupOldReports();
    const range = String(req.query.range || "24h");
    const fromDate = getRangeStartDate(range);

    const reports = await Report.find({ organizationId: req.organizationId })
      .where("reportedAt")
      .gte(fromDate)
      .sort({ reportedAt: -1 })
      .populate({
        path: "passengerId",
        select: "name rollNo stopName"
      })
      .limit(200);

    const data = reports.map((r) => ({
      _id: r._id,
      passengerId: r.passengerId?._id || null,
      passengerName: r.passengerId?.name || "Unknown",
      rollNo: r.passengerId?.rollNo || "-",
      stopName: r.passengerId?.stopName || "-",
      busId: r.busId || "-",
      category: r.category,
      message: r.message || "-",
      latitude: r.latitude,
      longitude: r.longitude,
      reportedAt: r.reportedAt,
      locationLink: buildLocationLink(r.latitude, r.longitude)
    }));

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
