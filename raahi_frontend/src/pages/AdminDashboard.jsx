import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import PassengerManagement from "./PassengerManagement";
import AnalyticsPanel from "./AnalyticsPanel";
import RouteManagement from "./RouteManagement";
import BusManagement from "./BusManagement";
import SosAlerts from "./SosAlerts";
import "./admin.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Students");
  const [sosNotificationCount, setSosNotificationCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState(() => {
    const saved = localStorage.getItem("adminLastSeenSosAt");
    return saved ? Number(saved) : Date.now();
  });

  useEffect(() => {
    const loadSosCount = async () => {
      try {
        const res = await axios.get("/api/sos", {
          params: { range: "1y" }
        });
        const alerts = res.data || [];
        const unseen = alerts.filter((a) => {
          const ts = new Date(a.triggeredAt || a.time).getTime();
          return ts > lastSeenAt;
        }).length;

        if (activeTab === "SOS Alerts") {
          const newestTs = alerts[0]
            ? new Date(alerts[0].triggeredAt || alerts[0].time).getTime()
            : Date.now();
          setSosNotificationCount(0);
          if (newestTs > lastSeenAt) {
            setLastSeenAt(newestTs);
            localStorage.setItem("adminLastSeenSosAt", String(newestTs));
          }
          return;
        }

        setSosNotificationCount(unseen);
      } catch (error) {
        console.error("Failed to fetch SOS notifications", error);
      }
    };

    loadSosCount();
    const t = setInterval(loadSosCount, 10000);
    return () => clearInterval(t);
  }, [activeTab, lastSeenAt]);

  const handleTabChange = (tab) => {
    if (tab === "Logout") {
      window.location.reload();
      return;
    }
    if (tab === "SOS Alerts") {
      const nowTs = Date.now();
      setSosNotificationCount(0);
      setLastSeenAt(nowTs);
      localStorage.setItem("adminLastSeenSosAt", String(nowTs));
    }
    setActiveTab(tab);
  };

  return (
    <div className="admin_layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sosNotificationCount={sosNotificationCount}
      />
      <div className="admin_content">
        <h2 className="admin_h2">Organisation Admin Panel</h2>
        {activeTab === "Students" && <PassengerManagement />}
        {activeTab === "SOS Alerts" && <SosAlerts />}
        {activeTab === "Analytics" && <AnalyticsPanel />}
        {activeTab === "Buses" && <BusManagement />}
        {activeTab === "Routes" && <RouteManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;

