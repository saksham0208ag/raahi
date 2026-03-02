import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./BusTracking.css";
import axios from "axios";
import busIconImg from "../assets/bus1.png";

const busIcon = L.icon({
  iconUrl: busIconImg,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -20],
  className: "bus-marker-icon"
});

const getTileConfig = (theme) => {
  if (theme === "dark") {
    return {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
    };
  }
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors"
  };
};

const toRad = (value) => (value * Math.PI) / 180;
const toDeg = (value) => (value * 180) / Math.PI;

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getBearing = (lat1, lon1, lat2, lon2) => {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

const getProgressOnRoute = (coordinates, lat, lng) => {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return 0;
  let bestDistanceSq = Number.POSITIVE_INFINITY;
  let bestProgress = 0;
  const maxIndex = coordinates.length - 1;

  for (let i = 0; i < maxIndex; i += 1) {
    const aLat = coordinates[i][0];
    const aLng = coordinates[i][1];
    const bLat = coordinates[i + 1][0];
    const bLng = coordinates[i + 1][1];
    const dLat = bLat - aLat;
    const dLng = bLng - aLng;
    const lenSq = dLat * dLat + dLng * dLng;
    if (!lenSq) continue;

    const tRaw = ((lat - aLat) * dLat + (lng - aLng) * dLng) / lenSq;
    const t = Math.max(0, Math.min(1, tRaw));
    const pLat = aLat + dLat * t;
    const pLng = aLng + dLng * t;
    const distSq = (lat - pLat) * (lat - pLat) + (lng - pLng) * (lng - pLng);

    if (distSq < bestDistanceSq) {
      bestDistanceSq = distSq;
      bestProgress = (i + t) / maxIndex;
    }
  }

  return Math.max(0, Math.min(1, bestProgress));
};

const getKmAtProgress = (progress, cumulativeKm) => {
  if (!Array.isArray(cumulativeKm) || cumulativeKm.length < 2) return 0;
  const maxIndex = cumulativeKm.length - 1;
  const clamped = Math.max(0, Math.min(1, progress));
  const floatIndex = clamped * maxIndex;
  const lowIndex = Math.floor(floatIndex);
  const highIndex = Math.min(maxIndex, lowIndex + 1);
  const t = floatIndex - lowIndex;
  return cumulativeKm[lowIndex] + (cumulativeKm[highIndex] - cumulativeKm[lowIndex]) * t;
};

const buildRouteCoordinates = (center, stopCount) => {
  const points = [];
  const count = Math.max(2, stopCount);
  for (let i = 0; i < count; i += 1) {
    const x = i / (count - 1);
    const curve = Math.sin(x * Math.PI) * 0.012;
    points.push([center.lat + x * 0.03 - 0.012, center.lng + curve - 0.01 + x * 0.028]);
  }
  return points;
};

const STATUS_COLORS = {
  on_time: "#16a34a",
  delayed: "#f59e0b",
  rerouting: "#ef4444"
};

const BusTracking = ({ passengerId, passengerProfile, theme = "light" }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);
  const routeLineCasingRef = useRef(null);
  const routeLineMainRef = useRef(null);
  const routeActiveCasingRef = useRef(null);
  const routeActiveMainRef = useRef(null);
  const stopMarkersRef = useRef([]);
  const previousLocationRef = useRef(null);
  const initialCenterRef = useRef({ lat: 26.9124, lng: 75.7873 });

  const [location, setLocation] = useState({
    latitude: initialCenterRef.current.lat,
    longitude: initialCenterRef.current.lng,
    updatedAt: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [showSOS, setShowSOS] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("tracking_onboarding_seen"));
  const [panelMode, setPanelMode] = useState("mid");
  const [clock, setClock] = useState(new Date());
  const [busSpeed, setBusSpeed] = useState(0);
  const [heading, setHeading] = useState(0);
  const [passengerCount, setPassengerCount] = useState(0);
  const [activityLog, setActivityLog] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [tripProgress, setTripProgress] = useState(0.04);
  const trackedBusId = passengerProfile?.busId || "";

  const stopNames = useMemo(() => {
    const routeStops = Array.isArray(passengerProfile?.routeStops) ? passengerProfile.routeStops : [];
    const list = [passengerProfile?.routeStartPoint, ...routeStops, passengerProfile?.routeEndPoint].filter(Boolean);
    const normalized = [...new Set(list.map((item) => String(item).trim()))];
    return normalized.length > 1 ? normalized : ["Start", passengerProfile?.stopName || "Current Stop", "Campus"];
  }, [passengerProfile]);

  const routeCoordinates = useMemo(
    () => buildRouteCoordinates(initialCenterRef.current, stopNames.length),
    [stopNames.length]
  );
  const cumulativeRouteKm = useMemo(() => {
    if (!routeCoordinates.length) return [0];
    const cumulative = [0];
    for (let i = 1; i < routeCoordinates.length; i += 1) {
      const prev = routeCoordinates[i - 1];
      const cur = routeCoordinates[i];
      cumulative.push(
        cumulative[i - 1] + getDistanceKm(prev[0], prev[1], cur[0], cur[1])
      );
    }
    return cumulative;
  }, [routeCoordinates]);

  const activeRouteCoordinates = useMemo(() => {
    if (!routeCoordinates.length) return [];
    if (routeCoordinates.length === 1) return routeCoordinates;

    const maxIndex = routeCoordinates.length - 1;
    const progressIndex = Math.max(0, Math.min(maxIndex, tripProgress * maxIndex));
    const wholeIndex = Math.floor(progressIndex);
    const fraction = progressIndex - wholeIndex;

    const active = routeCoordinates.slice(0, wholeIndex + 1);
    if (wholeIndex < maxIndex) {
      const start = routeCoordinates[wholeIndex];
      const end = routeCoordinates[wholeIndex + 1];
      active.push([
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction
      ]);
    }
    return active;
  }, [routeCoordinates, tripProgress]);

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const logEvent = (kind, message) => {
    setActivityLog((prev) => [
      {
        id: `${Date.now()}-${kind}`,
        kind,
        message,
        timestamp: new Date()
      },
      ...prev
    ]);
  };

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    logEvent("system", "Tracking started");

    return () => {
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) return;

    const tileConfig = getTileConfig(theme);
    mapRef.current = L.map("map", { zoomControl: true }).setView([location.latitude, location.longitude], 14);

    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution
    }).addTo(mapRef.current);

    markerRef.current = L.marker([location.latitude, location.longitude], { icon: busIcon }).addTo(mapRef.current);

    setTimeout(() => mapRef.current?.invalidateSize(), 250);
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileConfig = getTileConfig(theme);
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [theme]);

  useEffect(() => {
    if (!trackedBusId) {
      setLoading(false);
      pushToast("error", "No bus assigned for this passenger.");
      return;
    }

    let mounted = true;
    const loadLiveLocation = async () => {
      try {
        const res = await axios.get(`/api/location/live/${trackedBusId}`);
        if (!mounted) return;
        const live = res.data || {};
        setLocation({
          latitude: Number(live.latitude) || initialCenterRef.current.lat,
          longitude: Number(live.longitude) || initialCenterRef.current.lng,
          updatedAt: live.timestamp ? new Date(live.timestamp) : new Date()
        });
      } catch (error) {
        if (error?.response?.status !== 404) {
          console.error("Failed to fetch live bus location", error);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadLiveLocation();
    const interval = setInterval(loadLiveLocation, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [trackedBusId]);

  useEffect(() => {
    const previous = previousLocationRef.current;
    if (previous) {
      const distanceKm = getDistanceKm(
        previous.latitude,
        previous.longitude,
        location.latitude,
        location.longitude
      );
      const seconds = (location.updatedAt - previous.updatedAt) / 1000;
      const speedKmh = seconds > 0 ? (distanceKm / seconds) * 3600 : 0;
      const bearing = getBearing(previous.latitude, previous.longitude, location.latitude, location.longitude);
      setHeading(bearing);
      setBusSpeed(Number.isFinite(speedKmh) ? speedKmh : 0);
    }

    previousLocationRef.current = {
      latitude: location.latitude,
      longitude: location.longitude,
      updatedAt: location.updatedAt
    };
  }, [location]);

  useEffect(() => {
    if (!routeCoordinates.length) return;
    const progress = getProgressOnRoute(routeCoordinates, location.latitude, location.longitude);
    setTripProgress(progress);
  }, [location, routeCoordinates]);

  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;

    markerRef.current.setLatLng([location.latitude, location.longitude]);
    mapRef.current.panTo([location.latitude, location.longitude], { animate: true, duration: 1 });

    const markerElement = markerRef.current.getElement();
    if (markerElement) {
      const transform = markerElement.style.transform || "";
      markerElement.style.transform = `${transform.replace(/rotate\\([^)]*\\)/g, "")} rotate(${heading.toFixed(1)}deg)`;
    }
  }, [location, heading]);

  const currentStopIndex = Math.min(
    stopNames.length - 1,
    Math.max(0, Math.floor(tripProgress * (stopNames.length - 1)))
  );
  const nextStop = stopNames[Math.min(stopNames.length - 1, currentStopIndex + 1)] || "Final Stop";
  const studentStopIndexRaw = stopNames.findIndex(
    (s) => String(s).trim().toLowerCase() === String(passengerProfile?.stopName || "").trim().toLowerCase()
  );
  const studentStopIndex = studentStopIndexRaw >= 0 ? studentStopIndexRaw : Math.min(stopNames.length - 1, currentStopIndex + 1);
  const maxRouteIndex = Math.max(1, routeCoordinates.length - 1);
  const busKm = getKmAtProgress(tripProgress, cumulativeRouteKm);
  const stopKm = getKmAtProgress(studentStopIndex / maxRouteIndex, cumulativeRouteKm);
  const remainingKmToStop = Math.max(0, stopKm - busKm);
  const effectiveSpeed = busSpeed > 6 ? busSpeed : 18;
  const etaMinutes =
    remainingKmToStop <= 0.05
      ? 0
      : Math.max(1, Math.round((remainingKmToStop / Math.max(8, effectiveSpeed)) * 60));
  const secondsSinceLastGps = Math.floor((clock.getTime() - new Date(location.updatedAt).getTime()) / 1000);
  const tripStarted = !loading && secondsSinceLastGps <= 120;
  const arrivalClock = new Date(clock.getTime() + etaMinutes * 60 * 1000);
  const arrivalTimeLabel = tripStarted
    ? arrivalClock.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Trip not started";

  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLineCasingRef.current) mapRef.current.removeLayer(routeLineCasingRef.current);
    if (routeLineMainRef.current) mapRef.current.removeLayer(routeLineMainRef.current);
    if (routeActiveCasingRef.current) mapRef.current.removeLayer(routeActiveCasingRef.current);
    if (routeActiveMainRef.current) mapRef.current.removeLayer(routeActiveMainRef.current);
    stopMarkersRef.current.forEach((marker) => mapRef.current.removeLayer(marker));
    stopMarkersRef.current = [];

    routeLineCasingRef.current = L.polyline(routeCoordinates, {
      color: "#ffffff",
      weight: 10,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(mapRef.current);

    routeLineMainRef.current = L.polyline(routeCoordinates, {
      color: "#93c5fd",
      weight: 5,
      opacity: 0.8,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(mapRef.current);

    routeActiveCasingRef.current = L.polyline(activeRouteCoordinates, {
      color: "#ffffff",
      weight: 10,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(mapRef.current);

    routeActiveMainRef.current = L.polyline(activeRouteCoordinates, {
      color: "#1a73e8",
      weight: 6,
      opacity: 0.98,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(mapRef.current);

    stopNames.forEach((stop, index) => {
      const marker = L.circleMarker(routeCoordinates[index], {
        radius: index === currentStopIndex ? 8 : 6,
        fillColor: index <= currentStopIndex ? "#16a34a" : "#f59e0b",
        color: "#fff",
        weight: 2,
        fillOpacity: 0.95
      }).addTo(mapRef.current);
      marker.bindTooltip(stop, { direction: "top" });
      stopMarkersRef.current.push(marker);
    });
  }, [routeCoordinates, activeRouteCoordinates, stopNames, currentStopIndex]);

  const lastUpdatedSeconds = Math.floor((clock.getTime() - new Date(location.updatedAt).getTime()) / 1000);
  const connectionQuality =
    lastUpdatedSeconds <= 5 ? "Good" : lastUpdatedSeconds <= 12 ? "Moderate" : "Poor";

  const scheduleState =
    busSpeed >= 15 ? "on_time" : busSpeed >= 8 ? "delayed" : "rerouting";

  const statusLabel = scheduleState === "on_time" ? "On Time" : scheduleState === "delayed" ? "Delayed" : "Rerouting";

  const driverStatus = busSpeed > 1 ? "Driving" : "At Stop";
  const passengerLoadPercent = Math.min(100, Math.round((passengerCount / 52) * 100));

  const sendSOS = async () => {
    try {
      if (!passengerId) {
        pushToast("error", "Passenger ID not found. Please login again.");
        return;
      }

      const res = await axios.post("/api/sos", {
        passengerId,
        busId: trackedBusId || "",
        latitude: location.latitude,
        longitude: location.longitude,
        time: new Date().toISOString()
      });

      if (res.data.success) {
        pushToast("success", "SOS sent successfully.");
        logEvent("sos", "SOS triggered");
        setShowSOS(false);
      } else {
        pushToast("error", "Unable to send SOS.");
      }
    } catch (error) {
      pushToast("error", error?.response?.data?.error || "Failed to send SOS");
    }
  };

  const studentName = passengerProfile?.name || "Unknown";
  const studentRollNo = passengerProfile?.rollNo || "N/A";
  const studentStop = passengerProfile?.stopName || "N/A";

  const handleBoard = () => {
    setPassengerCount((prev) => prev + 1);
    logEvent("boarded", `${studentName} boarded`);
    pushToast("success", "Passenger count updated: boarded.");
  };

  const handleDepart = () => {
    setPassengerCount((prev) => Math.max(0, prev - 1));
    logEvent("departed", `${studentName} departed`);
    pushToast("info", "Passenger count updated: departed.");
  };

  const quickReport = async (label) => {
    try {
      if (!passengerId) {
        pushToast("error", "Passenger ID not found. Please login again.");
        return;
      }

      await axios.post("/api/reports", {
        passengerId,
        busId: passengerProfile?.busId || "",
        category: label,
        message: `Reported by ${studentName}`,
        latitude: location.latitude,
        longitude: location.longitude,
        reportedAt: new Date().toISOString()
      });

      logEvent("report", `Reported: ${label}`);
      pushToast("info", `Report submitted: ${label}`);
    } catch (error) {
      pushToast("error", error?.response?.data?.error || "Failed to submit report");
    }
  };

  const dismissOnboarding = () => {
    localStorage.setItem("tracking_onboarding_seen", "1");
    setShowOnboarding(false);
  };

  const cyclePanelMode = () => {
    setPanelMode((prev) => (prev === "peek" ? "mid" : prev === "mid" ? "full" : "peek"));
  };

  return (
    <div className="BusTracking" aria-live="polite">
      <div id="map" className="BusTracking_map" aria-label="Live bus tracking map"></div>
      <div className="map-atmosphere" aria-hidden="true"></div>

      <header className="trip-status-strip">
        <div className="status-pill" style={{ borderColor: STATUS_COLORS[scheduleState] }}>
          <span className="dot" style={{ background: STATUS_COLORS[scheduleState] }}></span>
          {statusLabel}
        </div>
        <div className="status-item">Next Stop: <strong>{nextStop}</strong></div>
        <div className="status-item">ETA: <strong>{etaMinutes} min</strong></div>
        <div className="status-item">Arrival: <strong>{arrivalTimeLabel}</strong></div>
        <div className="status-item">Driver: <strong>{driverStatus}</strong></div>
      </header>

      <button
        className="sos-btn"
        aria-label="Send emergency SOS"
        onClick={() => setShowSOS(true)}
      >
        SOS
      </button>

      {showOnboarding && (
        <aside className="onboarding-card" role="dialog" aria-label="Tracking quick guide">
          <h3>Quick Guide</h3>
          <p>View ETA and next stop on top. Use Boarded/Departed to track occupancy.</p>
          <p>Tap Report actions for assistance, and use SOS for emergency only.</p>
          <button onClick={dismissOnboarding}>Start Tracking</button>
        </aside>
      )}

      <section className={`tracking-slider mode-${panelMode}`}>
        <button
          className="tracking-slider-toggle"
          onClick={cyclePanelMode}
          aria-label="Change details panel size"
        >
          {panelMode === "peek" ? "Expand" : panelMode === "mid" ? "Show More" : "Minimize"}
        </button>

        <div className="tracking-slider-content">
          {loading ? (
            <div className="skeleton-wrap" aria-label="Loading tracking data">
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
              <div className="skeleton-row"></div>
            </div>
          ) : (
            <>
              <div className="profile-chip">
                <div className="avatar">{studentName.slice(0, 1).toUpperCase()}</div>
                <div>
                  <strong>{studentName}</strong>
                  <p>{studentRollNo}</p>
                </div>
              </div>

              <div className="tracking-top-metrics">
                <article className={`metric-card ${busSpeed > 14 ? "good" : busSpeed > 8 ? "warn" : "bad"}`}>
                  <span className="metric-label">Bus Speed</span>
                  <strong>{busSpeed.toFixed(1)} km/h</strong>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Passenger Count</span>
                  <strong>{passengerCount}</strong>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Connection</span>
                  <strong>{connectionQuality}</strong>
                  <small>Updated {Math.max(0, lastUpdatedSeconds)}s ago</small>
                </article>
                <article className="metric-card">
                  <span className="metric-label">Heading</span>
                  <strong>{heading.toFixed(0)} deg</strong>
                </article>
              </div>

              <div className="tracking-actions" role="group" aria-label="Passenger counter actions">
                <button className="board-btn" onClick={handleBoard}>Boarded</button>
                <button className="depart-btn" onClick={handleDepart}>Departed</button>
              </div>

              <div className="quick-reports" role="group" aria-label="Quick report actions">
                <button onClick={() => quickReport("Wrong stop")}>Wrong Stop</button>
                <button onClick={() => quickReport("Bus crowded")}>Bus Crowded</button>
                <button onClick={() => quickReport("Need assistance")}>Need Assistance</button>
              </div>

              <div className="card-block route-timeline">
                <h3>All Stops Timeline</h3>
                {stopNames.map((stop, index) => {
                  const stateClass =
                    index < currentStopIndex
                      ? "timeline-stop-completed"
                      : index === currentStopIndex
                        ? "timeline-stop-current"
                        : "timeline-stop-upcoming";
                  const isUserStop = index === studentStopIndex;
                  return (
                    <div key={`${stop}-${index}`} className={`timeline-stop-row ${stateClass}`}>
                      <span className="timeline-stop-dot" />
                      <span className="timeline-stop-name">{stop}</span>
                      {isUserStop && <span className="timeline-stop-tag">Your Stop</span>}
                    </div>
                  );
                })}
              </div>

              <div className="student-info card-block">
                <h3>My Bus Context</h3>
                <p><b>Route:</b> {passengerProfile?.routeName || "N/A"}</p>
                <p><b>From-To:</b> {passengerProfile?.routeStartPoint || "N/A"} {"->"} {passengerProfile?.routeEndPoint || "N/A"}</p>
                <p><b>Stop:</b> {studentStop}</p>
                <p><b>Bus Number:</b> {passengerProfile?.busNumber || "N/A"}</p>
                <p><b>Load:</b> {passengerLoadPercent}%</p>
                <div className="load-bar" aria-label={`Current bus load ${passengerLoadPercent} percent`}>
                  <span style={{ width: `${passengerLoadPercent}%` }}></span>
                </div>
                <p><b>Guardian:</b> {passengerProfile?.guardianName || "N/A"} ({passengerProfile?.guardianPhone || "N/A"})</p>
                <p><b>Current Time:</b> {clock.toLocaleTimeString()}</p>
                <p><b>Last GPS Time:</b> {new Date(location.updatedAt).toLocaleString()}</p>
              </div>

              <div className="timeline card-block">
                <h3>Passenger Timeline</h3>
                {activityLog.length === 0 && <p className="activity-empty">No events yet.</p>}
                {activityLog.slice(0, 6).map((item) => (
                  <p key={item.id}>
                    <b>{item.kind.toUpperCase()}</b> - {item.message} - {new Date(item.timestamp).toLocaleTimeString()}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {showSOS && (
        <div className="sos-overlay" role="dialog" aria-label="Emergency SOS confirmation">
          <div className="sos-card">
            <h3>Emergency SOS</h3>
            <p>Do you want to send SOS now?</p>
            <div className="sos-actions">
              <button className="cancel" onClick={() => setShowSOS(false)}>Cancel</button>
              <button className="confirm" onClick={sendSOS}>Send SOS</button>
            </div>
          </div>
        </div>
      )}

      <div className="toast-stack" aria-live="assertive">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BusTracking;
