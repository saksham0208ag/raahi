const express = require("express");
const router = express.Router();
const Organization = require("../models/Organization");
const Bus = require("../models/Bus");
const Passenger = require("../models/Passenger");
const Route = require("../models/Route");
const { requireOrganization, isSubscriptionExpired } = require("../middleware/organizationContext");
const { PLAN_LIMITS, PLAN_DETAILS, getPlanLimits } = require("../config/planLimits");

const normalizeCode = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");

const isSuperAdmin = (req) => {
  const key = String(req.headers["x-super-admin-key"] || req.query.superAdminKey || "").trim();
  return Boolean(key && process.env.SUPER_ADMIN_KEY && key === process.env.SUPER_ADMIN_KEY);
};

const toDateOrNull = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const getDefaultSubscriptionEnd = (plan, trialEndsAt) => {
  if (String(plan || "trial").toLowerCase() === "trial") return trialEndsAt;
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

const refreshOrganizationStatusIfExpired = async (organization) => {
  if (!organization) return organization;
  if (isSubscriptionExpired(organization) && organization.status !== "inactive") {
    organization.status = "inactive";
    await organization.save();
  }
  return organization;
};

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const code = normalizeCode(req.body.code);

    if (!name || !code) {
      return res.status(400).json({ error: "name and code are required" });
    }

    const existing = await Organization.findOne({ code });
    if (existing) {
      return res.status(409).json({ error: "Organization code already exists" });
    }

    const organization = await Organization.create({
      name,
      code,
      plan: req.body.plan || "trial",
      subscriptionEndsAt:
        toDateOrNull(req.body.subscriptionEndsAt) ||
        getDefaultSubscriptionEnd(req.body.plan || "trial", undefined)
    });

    if (!organization.subscriptionEndsAt) {
      organization.subscriptionEndsAt = getDefaultSubscriptionEnd(organization.plan, organization.trialEndsAt);
      await organization.save();
    }

    return res.status(201).json({
      _id: organization._id,
      name: organization.name,
      code: organization.code,
      plan: organization.plan,
      status: organization.status,
      trialEndsAt: organization.trialEndsAt,
      subscriptionEndsAt: organization.subscriptionEndsAt
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get("/resolve", async (req, res) => {
  try {
    const code = normalizeCode(req.query.code || req.body.code);
    if (!code) return res.status(400).json({ error: "code is required" });

    const organization = await Organization.findOne({ code });
    if (!organization) return res.status(404).json({ error: "Organization not found" });
    await refreshOrganizationStatusIfExpired(organization);

    if (organization.status !== "active") {
      return res.status(403).json({ error: "Organization subscription is inactive/expired" });
    }

    return res.json({
      _id: organization._id,
      name: organization.name,
      code: organization.code,
      plan: organization.plan,
      status: organization.status,
      trialEndsAt: organization.trialEndsAt,
      subscriptionEndsAt: organization.subscriptionEndsAt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/plans", async (_req, res) => {
  try {
    return res.json({
      plans: PLAN_LIMITS,
      details: PLAN_DETAILS
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ error: "Super admin access required" });
    }

    const organizations = await Organization.find().sort({ createdAt: -1 }).limit(500);
    await Promise.all(organizations.map((org) => refreshOrganizationStatusIfExpired(org)));
    return res.json(organizations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id/status", async (req, res) => {
  try {
    if (!isSuperAdmin(req)) {
      return res.status(403).json({ error: "Super admin access required" });
    }

    const organization = await Organization.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const requestedStatus = String(req.body.status || "").trim().toLowerCase();
    if (!["active", "inactive", "toggle"].includes(requestedStatus)) {
      return res.status(400).json({ error: "status must be active, inactive, or toggle" });
    }

    const nextStatus =
      requestedStatus === "toggle"
        ? organization.status === "active"
          ? "inactive"
          : "active"
        : requestedStatus;

    if (nextStatus === "active") {
      const requestedEndDate = toDateOrNull(req.body.subscriptionEndsAt);
      const isExpired = isSubscriptionExpired(organization);
      if (requestedEndDate) {
        organization.subscriptionEndsAt = requestedEndDate;
      } else if (isExpired || !organization.subscriptionEndsAt) {
        organization.subscriptionEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
      organization.status = "active";
    } else {
      organization.status = "inactive";
    }

    await organization.save();
    return res.json({
      message: "Organization status updated",
      organization
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/usage", requireOrganization, async (req, res) => {
  try {
    const [busCount, passengerCount, routeCount] = await Promise.all([
      Bus.countDocuments({ organizationId: req.organizationId }),
      Passenger.countDocuments({ organizationId: req.organizationId }),
      Route.countDocuments({ organizationId: req.organizationId })
    ]);

    const limits = getPlanLimits(req.organization?.plan);
    return res.json({
      organization: {
        _id: req.organization?._id,
        name: req.organization?.name,
        code: req.organization?.code,
        plan: req.organization?.plan,
        status: req.organization?.status,
        subscriptionEndsAt: req.organization?.subscriptionEndsAt || req.organization?.trialEndsAt || null
      },
      usage: {
        buses: busCount,
        passengers: passengerCount,
        routes: routeCount
      },
      limits
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
