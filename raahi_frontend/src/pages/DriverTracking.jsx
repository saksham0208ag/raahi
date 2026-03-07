import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./admin.css";

const DriverTracking = ({ driverProfile, onLogout }) => {
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState("");
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [statusText, setStatusText] = useState("Idle");
  const [lastSentAt, setLastSentAt] = useState(null);
  const [lastCoords, setLastCoords] = useState(null);

  const watchIdRef = useRef(null);
  const heartbeatRef = useRef(null);
  const lastPushMsRef = useRef(0);
  const latestCoordsRef = useRef(null);

  const loadBuses = async () => {
    try {
      const items = Array.isArray(driverProfile?.buses) && driverProfile.buses.length
        ? driverProfile.buses
        : (await axios.get("/api/buses")).data || [];
      setBuses(items);
      const preferredBusId = driverProfile?.assignedBusId || "";
      if (!selectedBusId && preferredBusId) {
        setSelectedBusId(preferredBusId);
      } else if (!selectedBusId && items[0]?._id) {
        setSelectedBusId(items[0]._id);
      }
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load buses for this organization");
    } finally {
      setLoadingBuses(false);
    }
  };

  useEffect(() => {
    loadBuses();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (heartbeatRef.current !== null) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!sharing) return;
      event.preventDefault();
      event.returnValue = "Trip is active. Stop trip manually before leaving.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sharing]);

  const pushLocation = async (coords) => {
    if (!selectedBusId) return;
    await axios.post("/api/location/update", {
      busId: selectedBusId,
      latitude: coords.latitude,
      longitude: coords.longitude
    });
    setLastCoords({
      latitude: coords.latitude,
      longitude: coords.longitude
    });
    setLastSentAt(new Date());
  };

  const startSharing = async () => {
    if (!selectedBusId) {
      alert("Please select a bus first.");
      return;
    }
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device/browser.");
      return;
    }

    try {
      setStatusText("Starting location sharing...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          latestCoordsRef.current = position.coords;
          await pushLocation(position.coords);
        },
        (error) => {
          setStatusText(`GPS error: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    } catch (_) {}

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        latestCoordsRef.current = position.coords;
        const nowMs = Date.now();
        if (nowMs - lastPushMsRef.current < 3000) return;
        lastPushMsRef.current = nowMs;
        try {
          await pushLocation(position.coords);
          setStatusText("Live location sharing active");
        } catch (error) {
          setStatusText(error?.response?.data?.error || "Failed to push location");
        }
      },
      (error) => {
        setStatusText(`GPS error: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    // Heartbeat keeps backend location fresh even if watch callbacks are sparse.
    heartbeatRef.current = setInterval(async () => {
      if (!latestCoordsRef.current) return;
      try {
        await pushLocation(latestCoordsRef.current);
      } catch (_) {}
    }, 5000);

    setSharing(true);
  };

  const stopSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (heartbeatRef.current !== null) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    latestCoordsRef.current = null;
    setSharing(false);
    setStatusText("Location sharing stopped");
  };

  const handleLogoutClick = () => {
    if (sharing) {
      alert("Trip is active. Stop Trip manually before logout.");
      return;
    }
    onLogout && onLogout();
  };

  return (
    <div className="admin_layout">
      <div className="sidebar">
        <h3 className="sidebar_h3">Driver Panel</h3>
        <ul className="sidebar_ul">
          <li className="sidebar_li sidebar_li_active">Live Tracking</li>
          <li className="sidebar_li" onClick={handleLogoutClick}>Logout</li>
        </ul>
      </div>

      <div className="admin_content">
        <h2 className="admin_h2">Driver Live Location Sharing</h2>

        <div className="passenger_management">
          <div className="pm_header">
            <h2 className="pm_header_h2">Trip Controls {driverProfile?.name ? `- ${driverProfile.name}` : ""}</h2>
            <button className="pm_header_button" onClick={loadBuses}>Refresh Buses</button>
          </div>

          {loadingBuses ? (
            <p>Loading buses...</p>
          ) : (
            <>
              <div className="form-group">
                <label>Select Bus</label>
                <select
                  className="route_select"
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  disabled={sharing}
                >
                  <option value="">Choose bus</option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.busNumber} ({b.status || "running"})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                {!sharing ? (
                  <button className="pm_header_button" onClick={startSharing}>Start Trip</button>
                ) : (
                  <button className="delete_btn action_btn" onClick={stopSharing}>Stop Trip</button>
                )}
              </div>

              <div style={{ marginTop: "16px" }}>
                <h3>Status</h3>
                <p><b>Live Sharing:</b> {sharing ? "ON" : "OFF"}</p>
                <p><b>Message:</b> {statusText}</p>
                <p><b>Last Sent:</b> {lastSentAt ? lastSentAt.toLocaleString() : "Not sent yet"}</p>
                <p>
                  <b>Last Coordinates:</b>{" "}
                  {lastCoords
                    ? `${lastCoords.latitude.toFixed(6)}, ${lastCoords.longitude.toFixed(6)}`
                    : "N/A"}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverTracking;
