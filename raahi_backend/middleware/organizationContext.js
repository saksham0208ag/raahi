const Organization = require("../models/Organization");

const normalize = (value) => String(value || "").trim().toLowerCase();

async function organizationContext(req, _res, next) {
  try {
    const organizationId = req.headers["x-organization-id"];
    const organizationCode = normalize(
      req.headers["x-organization-code"] ||
        req.query.organizationCode ||
        req.body?.organizationCode
    );

    let organization = null;
    if (organizationId) {
      organization = await Organization.findById(organizationId);
    } else if (organizationCode) {
      organization = await Organization.findOne({ code: organizationCode });
    }

    req.organization = organization || null;
    req.organizationId = organization?._id || null;
    req.organizationCode = organization?.code || organizationCode || "";
    next();
  } catch (err) {
    next(err);
  }
}

const getEffectiveSubscriptionEnd = (organization) =>
  organization?.subscriptionEndsAt || organization?.trialEndsAt || null;

function isSubscriptionExpired(organization) {
  const endsAt = getEffectiveSubscriptionEnd(organization);
  if (!endsAt) return false;
  return new Date(endsAt).getTime() < Date.now();
}

async function requireOrganization(req, res, next) {
  if (!req.organizationId) {
    return res.status(400).json({
      error: "Organization context is required. Send x-organization-code or x-organization-id."
    });
  }

  if (req.organization && isSubscriptionExpired(req.organization) && req.organization.status !== "inactive") {
    req.organization.status = "inactive";
    await req.organization.save();
  }

  if (req.organization && req.organization.status !== "active") {
    return res.status(403).json({
      error: "Organization is inactive. Contact platform support to reactivate subscription."
    });
  }
  return next();
}

module.exports = {
  organizationContext,
  requireOrganization,
  isSubscriptionExpired
};
