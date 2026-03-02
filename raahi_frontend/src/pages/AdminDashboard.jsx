import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import PassengerManagement from "./PassengerManagement";
import AnalyticsPanel from "./AnalyticsPanel";
import RouteManagement from "./RouteManagement";
import BusManagement from "./BusManagement";
import SosAlerts from "./SosAlerts";
import ReportedIssues from "./ReportedIssues";
import DriverManagement from "./DriverManagement";
import "./admin.css";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("Students");
  const [sosNotificationCount, setSosNotificationCount] = useState(0);
  const [reportedNotificationCount, setReportedNotificationCount] = useState(0);
  const [lastSeenSosAt, setLastSeenSosAt] = useState(() => {
    const saved = localStorage.getItem("adminLastSeenSosAt");
    return saved ? Number(saved) : Date.now();
  });
  const [lastSeenReportAt, setLastSeenReportAt] = useState(() => {
    const saved = localStorage.getItem("adminLastSeenReportAt");
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
          return ts > lastSeenSosAt;
        }).length;

        if (activeTab === "SOS Alerts") {
          const newestTs = alerts[0]
            ? new Date(alerts[0].triggeredAt || alerts[0].time).getTime()
            : Date.now();
          setSosNotificationCount(0);
          if (newestTs > lastSeenSosAt) {
            setLastSeenSosAt(newestTs);
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
  }, [activeTab, lastSeenSosAt]);

  useEffect(() => {
    const loadReportCount = async () => {
      try {
        const res = await axios.get("/api/reports", {
          params: { range: "1y" }
        });
        const reports = res.data || [];
        const unseen = reports.filter((r) => {
          const ts = new Date(r.reportedAt).getTime();
          return ts > lastSeenReportAt;
        }).length;

        if (activeTab === "Reported") {
          const newestTs = reports[0] ? new Date(reports[0].reportedAt).getTime() : Date.now();
          setReportedNotificationCount(0);
          if (newestTs > lastSeenReportAt) {
            setLastSeenReportAt(newestTs);
            localStorage.setItem("adminLastSeenReportAt", String(newestTs));
          }
          return;
        }

        setReportedNotificationCount(unseen);
      } catch (error) {
        console.error("Failed to fetch report notifications", error);
      }
    };

    loadReportCount();
    const t = setInterval(loadReportCount, 10000);
    return () => clearInterval(t);
  }, [activeTab, lastSeenReportAt]);

  const handleTabChange = (tab) => {
    if (tab === "Logout") {
      window.location.reload();
      return;
    }
    if (tab === "SOS Alerts") {
      const nowTs = Date.now();
      setSosNotificationCount(0);
      setLastSeenSosAt(nowTs);
      localStorage.setItem("adminLastSeenSosAt", String(nowTs));
    }
    if (tab === "Reported") {
      const nowTs = Date.now();
      setReportedNotificationCount(0);
      setLastSeenReportAt(nowTs);
      localStorage.setItem("adminLastSeenReportAt", String(nowTs));
    }
    setActiveTab(tab);
  };

  return (
    <div className="admin_layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        sosNotificationCount={sosNotificationCount}
        reportedNotificationCount={reportedNotificationCount}
      />
      <div className="admin_content">
        <h2 className="admin_h2">Organisation Admin Panel</h2>
        {activeTab === "Students" && <PassengerManagement />}
        {activeTab === "SOS Alerts" && <SosAlerts />}
        {activeTab === "Reported" && <ReportedIssues />}
        {activeTab === "Analytics" && <AnalyticsPanel />}
        {activeTab === "Buses" && <BusManagement />}
        {activeTab === "Routes" && <RouteManagement />}
        {activeTab === "Drivers" && <DriverManagement />}
      </div>
    </div>
  );
};

export default AdminDashboard;

