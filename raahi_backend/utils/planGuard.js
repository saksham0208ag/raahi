const Bus = require("../models/Bus");
const Passenger = require("../models/Passenger");
const Route = require("../models/Route");
const { getPlanLimits } = require("../config/planLimits");

const resourceConfig = {
  buses: {
    model: Bus,
    key: "maxBuses"
  },
  passengers: {
    model: Passenger,
    key: "maxPassengers"
  },
  routes: {
    model: Route,
    key: "maxRoutes"
  }
};

async function checkPlanLimit({ organizationId, plan, resource }) {
  const config = resourceConfig[resource];
  if (!config) {
    return { allowed: true, reason: "" };
  }

  const limits = getPlanLimits(plan);
  const maxAllowed = limits[config.key];
  if (!Number.isFinite(maxAllowed)) {
    return { allowed: true, reason: "" };
  }

  const currentCount = await config.model.countDocuments({ organizationId });
  if (currentCount >= maxAllowed) {
    return {
      allowed: false,
      reason: `Plan limit reached for ${resource}. Allowed: ${maxAllowed}. Upgrade plan to add more.`
    };
  }

  return { allowed: true, reason: "" };
}

module.exports = {
  checkPlanLimit
};
