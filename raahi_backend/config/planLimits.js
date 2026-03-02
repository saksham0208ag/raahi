const PLAN_LIMITS = {
  trial: {
    maxBuses: 3,
    maxPassengers: 120,
    maxRoutes: 6
  },
  basic: {
    maxBuses: 10,
    maxPassengers: 800,
    maxRoutes: 25
  },
  pro: {
    maxBuses: 40,
    maxPassengers: 5000,
    maxRoutes: 120
  },
  enterprise: {
    maxBuses: Number.MAX_SAFE_INTEGER,
    maxPassengers: Number.MAX_SAFE_INTEGER,
    maxRoutes: Number.MAX_SAFE_INTEGER
  }
};

const PLAN_DETAILS = {
  trial: {
    name: "Trial",
    bestFor: "Pilot testing for new institutions",
    limitations: [
      "Max 3 buses",
      "Max 120 passengers",
      "Max 6 routes",
      "Limited trial period"
    ]
  },
  basic: {
    name: "Basic",
    bestFor: "Small institutions",
    limitations: [
      "Max 10 buses",
      "Max 800 passengers",
      "Max 25 routes"
    ]
  },
  pro: {
    name: "Pro",
    bestFor: "Growing institutions and multi-campus operations",
    limitations: [
      "Max 40 buses",
      "Max 5000 passengers",
      "Max 120 routes"
    ]
  },
  enterprise: {
    name: "Enterprise",
    bestFor: "Large organizations requiring scale",
    limitations: [
      "No practical cap on buses",
      "No practical cap on passengers",
      "No practical cap on routes"
    ]
  }
};

const getPlanLimits = (plan) => PLAN_LIMITS[String(plan || "trial").toLowerCase()] || PLAN_LIMITS.trial;

module.exports = {
  PLAN_LIMITS,
  PLAN_DETAILS,
  getPlanLimits
};
