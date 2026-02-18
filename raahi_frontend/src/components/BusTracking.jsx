import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./BusTracking.css";
import axios from 'axios';
import busIconImg from "../assets/bus1.png";

const busIcon=L.icon({
  iconUrl:busIconImg,
  iconSize:[40,40],
  iconAnchor:[20,20],
  popupAnchor:[0,-20]
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

const BusTracking = ({ passengerId, theme = "light" }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // 📍 Live Location State
  const [location, setLocation] = useState({
    latitude: 26.9124,
    longitude: 75.7873,
    updatedAt:new Date()
  });

  // UI States
  const [showInfo, setShowInfo] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const [clock,setClock]=useState(new Date());

  useEffect(()=>{
    const t=setInterval(()=>setClock(new Date()),1000);
    return ()=>clearInterval(t);
  },[]);

  /* ================= MAP INITIALIZATION ================= */
  useEffect(() => {
    if (mapRef.current) return;
    const tileConfig = getTileConfig(theme);

    mapRef.current = L.map("map", {
      zoomControl: true,
    }).setView([location.latitude, location.longitude], 15);

    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution
    }).addTo(mapRef.current);

    markerRef.current = L.marker(
      [location.latitude, location.longitude],
      {icon:busIcon}
    ).addTo(mapRef.current);

    // Fix map rendering
    setTimeout(() => {
      mapRef.current.invalidateSize();
    }, 300);
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileConfig = getTileConfig(theme);
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [theme]);

  /* ================= AUTO LOCATION UPDATE ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setLocation((prev) => ({
        latitude: prev.latitude + 0.0002,
        longitude: prev.longitude + 0.0002,
        updatedAt:new Date()
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  /* ================= SMOOTH MARKER MOVE ================= */
  useEffect(() => {
    if (!markerRef.current) return;

    markerRef.current.setLatLng([
      location.latitude,
      location.longitude,
    ]);

    mapRef.current.panTo(
      [location.latitude, location.longitude],
      { animate: true, duration: 1 }
    );
  }, [location]);

  /* ================= SOS SEND ================= */
  const sendSOS = async () => {
    try {
      if (!passengerId) {
        alert("Passenger ID not found. Please login again.");
        return;
      }
      console.log("sos sending");
      const res=await axios.post("/api/sos",{
         passengerId,
         busId:"6976de0631cd7b4eccebea8",
         latitude:location.latitude,
         longitude:location.longitude,
         time:new Date().toISOString()});
    console.log("response :",res.data);

    if(res.data.success){
      alert("SOS Sent Successfully!");
      setShowSOS(false);
    }else{
      const emailReason = res?.data?.notification?.email?.reason || "unknown";
      const smsReason = res?.data?.notification?.sms?.reason || "unknown";
      alert(`Failed to send SOS. Email: ${emailReason}. SMS: ${smsReason}`);
    }
    } catch (error) {
      console.error("SOS error", error);
      alert(error?.response?.data?.error || "Failed to send SOS");
    }
  };

  return (
    <div className="BusTracking">

      {/* MAP */}
      <div id="map" className="BusTracking_map"></div>

      {/* INFO BUTTON */}
      <button
        className="info-btn"
        onClick={() => setShowInfo(!showInfo)}
      >
        i
      </button>

      {/* SOS BUTTON */}
      <button
        className="sos-btn"
        onClick={() => setShowSOS(true)}
      >
        SOS
      </button>

      {/* INFO CARD */}
      {showInfo && location.latitude && location.longitude && (
        <div className="info-card">
          <h3>Bus Information</h3>
          <p><b>Latitude:</b> {location.latitude.toFixed(6)}</p>
          <p><b>Longitude:</b> {location.longitude.toFixed(6)}</p>
         {/*<p><b>Time:</b> {clock.toLocalTimeString()}</p>*/ } 
          <button onClick={() => setShowInfo(false)}>Close</button>
        </div>
      )}

      {/* SOS CONFIRM POPUP */}
      {showSOS && (
        <div className="sos-overlay">
          <div className="sos-card">
            <h3>Emergency SOS</h3>
            <p>Do you want to send SOS?</p>
            <div className="sos-actions">
              <button className="cancel" onClick={() => setShowSOS(false)}>
                Cancel
              </button>
              <button className="confirm" onClick={sendSOS} 
              >
             Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusTracking;

