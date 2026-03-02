# Raahi Subscription Plan Manual

This manual helps organizations choose the right subscription plan based on their transport scale.

## Trial Plan
- Best for: Pilot testing and short evaluation
- Limits:
  - Maximum buses: 3
  - Maximum passengers: 120
  - Maximum routes: 6
- Note: Intended for temporary trial usage before paid upgrade.

## Basic Plan
- Best for: Small institutions
- Limits:
  - Maximum buses: 10
  - Maximum passengers: 800
  - Maximum routes: 25
- Recommendation: Suitable for single-campus schools/colleges with moderate daily ridership.

## Pro Plan
- Best for: Growing institutions and multi-campus operations
- Limits:
  - Maximum buses: 40
  - Maximum passengers: 5000
  - Maximum routes: 120
- Recommendation: Choose when transport operations span multiple routes and larger student base.

## Enterprise Plan
- Best for: Large organizations and high-scale deployments
- Limits:
  - Buses: Unlimited (practically uncapped)
  - Passengers: Unlimited (practically uncapped)
  - Routes: Unlimited (practically uncapped)
- Recommendation: Ideal for institutions requiring scale, flexibility, and long-term growth capacity.

## Plan Selection Quick Guide
- If you are starting with a small pilot: choose `Trial`.
- If your fleet is below 10 buses: choose `Basic`.
- If your operation is expanding beyond small scale: choose `Pro`.
- If you need no practical cap on operations: choose `Enterprise`.

## Enforcement Behavior in Raahi
- Limits are enforced when creating:
  - New buses
  - New passengers
  - New routes
- If a limit is reached, the API returns:
  - HTTP status: `403`
  - Error code: `PLAN_LIMIT_REACHED`
  - Message prompting plan upgrade
