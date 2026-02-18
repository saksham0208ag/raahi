const express = require("express");
const router = express.Router();
const SOS = require("../models/SOS");
const Passenger = require("../models/Passenger");

let nodemailer = null;
let twilio = null;

try {
  nodemailer = require("nodemailer");
} catch (_) {}

try {
  twilio = require("twilio");
} catch (_) {}

const buildLocationLink = (latitude, longitude) =>
  `https://www.google.com/maps?q=${latitude},${longitude}`;

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const cleanupOldSosRecords = async () => {
  const cutoff = new Date(Date.now() - ONE_YEAR_MS);
  await SOS.deleteMany({ triggeredAt: { $lt: cutoff } });
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

async function sendGuardianEmail({ toEmail, guardianName, passengerName, locationLink, time }) {
  try {
    if (!toEmail) return { sent: false, reason: "guardian email missing" };
    if (!nodemailer) return { sent: false, reason: "nodemailer not installed" };
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { sent: false, reason: "SMTP env missing" };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: "Raahi SOS Alert",
      text:
        `Emergency SOS triggered by ${passengerName || "your ward"}.\n` +
        `Time: ${time}\n` +
        `Live location: ${locationLink}`
    });

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

async function sendGuardianSMS({ toPhone, guardianName, passengerName, locationLink, time }) {
  try {
    if (!toPhone) return { sent: false, reason: "guardian phone missing" };
    if (!twilio) return { sent: false, reason: "twilio not installed" };
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_PHONE) {
      return { sent: false, reason: "Twilio env missing" };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_FROM_PHONE,
      to: toPhone,
      body:
        `Raahi SOS: ${passengerName || "Your ward"} requested help at ${time}. ` +
        `Live location: ${locationLink}`
    });

    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err.message };
  }
}

// POST /api/sos
router.post("/", async (req, res) => {
  try {
    await cleanupOldSosRecords();

    const { passengerId, busId, latitude, longitude, time } = req.body;

    if (!passengerId) {
      return res.status(400).json({ success: false, error: "passengerId is required" });
    }
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({ success: false, error: "Valid latitude and longitude are required" });
    }

    const passenger = await Passenger.findById(passengerId).populate("gaurdian");
    if (!passenger) {
      return res.status(404).json({ success: false, error: "Passenger not found" });
    }
    if (!passenger.gaurdian) {
      return res.status(400).json({ success: false, error: "Guardian not found for this passenger" });
    }

    const finalBusId = String(passenger.bus || busId || "");
    if (!finalBusId) {
      return res.status(400).json({ success: false, error: "busId is required" });
    }

    const sos = new SOS({
      passengerId,
      busId: finalBusId,
      latitude,
      longitude,
      time: time ? new Date(time) : new Date()
    });
    await sos.save();

    const locationLink = buildLocationLink(latitude, longitude);
    const messageTime = new Date(sos.time).toLocaleString();
    const guardian = passenger.gaurdian;

    const emailResult = await sendGuardianEmail({
      toEmail: guardian.email,
      guardianName: guardian.name,
      passengerName: passenger.name,
      locationLink,
      time: messageTime
    });

    const smsEnabled = String(process.env.ENABLE_SMS || "false") === "true";
    const smsResult = smsEnabled
      ? await sendGuardianSMS({
          toPhone: guardian.phone,
          guardianName: guardian.name,
          passengerName: passenger.name,
          locationLink,
          time: messageTime
        })
      : { sent: false, reason: "sms disabled" };

    return res.status(200).json({
      success: emailResult.sent,
      locationLink,
      notification: {
        email: emailResult,
        sms: smsResult
      }
    });
  } catch (err) {
    console.error("SOS error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/sos
router.get("/", async (req, res) => {
  try {
    await cleanupOldSosRecords();
    const range = String(req.query.range || "24h");
    const fromDate = getRangeStartDate(range);

    const alerts = await SOS.find()
      .where("triggeredAt").gte(fromDate)
      .sort({ triggeredAt: -1, time: -1 })
      .populate({
        path: "passengerId",
        select: "name rollNo stopName"
      })
      .limit(200);

    const data = alerts.map((a) => ({
      _id: a._id,
      passengerId: a.passengerId?._id || null,
      passengerName: a.passengerId?.name || "Unknown",
      rollNo: a.passengerId?.rollNo || "-",
      stopName: a.passengerId?.stopName || "-",
      busId: a.busId,
      latitude: a.latitude,
      longitude: a.longitude,
      time: a.time,
      triggeredAt: a.triggeredAt,
      locationLink: buildLocationLink(a.latitude, a.longitude)
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
