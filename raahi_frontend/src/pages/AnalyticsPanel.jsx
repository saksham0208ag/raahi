import { useEffect, useState } from "react";
import axios from "axios";

const AnalyticsPanel = () => {
  const [stats, setStats] = useState({
    activePassengers: 0,
    activeBuses: 0,
    routes: 0
  });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const [passengersRes, busesRes, routesRes] = await Promise.all([
          axios.get("/api/passengers"),
          axios.get("/api/buses"),
          axios.get("/api/routes")
        ]);

        const passengers = passengersRes.data || [];
        const buses = busesRes.data || [];
        const routes = routesRes.data || [];

        const activePassengers = passengers.filter((p) => (p.status || "active") === "active").length;
        const activeBuses = buses.filter((b) => {
          const status = (b.status || "running").toLowerCase();
          return status === "running" || status === "active";
        }).length;
        setStats({
          activePassengers,
          activeBuses,
          routes: routes.length
        });

        const busById = new Map(
          buses.map((b) => [String(b._id), b])
        );
        const routeNameById = new Map(
          routes.map((r) => [String(r._id), r.routeName || "Unnamed Route"])
        );

        const grouped = new Map();

        passengers.forEach((p) => {
          const busId = typeof p.bus === "string" ? p.bus : p.bus?._id;
          const bus = busById.get(String(busId || ""));

          const routeIdFromPassenger =
            typeof p.route === "string" ? p.route : p.route?._id;
          const routeIdFromBus =
            typeof bus?.route === "string" ? bus.route : bus?.route?._id;
          const routeId = routeIdFromPassenger || routeIdFromBus;

          const busLabel = bus?.busNumber || "Unassigned Bus";
          const routeLabel =
            (routeId && routeNameById.get(String(routeId))) ||
            (typeof bus?.route === "object" ? bus?.route?.routeName : null) ||
            "Unassigned Route";

          const key = `${busLabel}__${routeLabel}`;
          const current = grouped.get(key) || {
            bus: busLabel,
            route: routeLabel,
            students: 0
          };
          current.students += 1;
          grouped.set(key, current);
        });

        const groupedRows = Array.from(grouped.values()).sort((a, b) => b.students - a.students);
        setRows(groupedRows);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <p>Loading analytics...</p>;
  }

  const maxStudents = rows.length > 0 ? Math.max(...rows.map((r) => r.students)) : 1;

  return (
    <div>
      <div className="analytics_grid">
        <div className="analytics_card">
          <p className="analytics_label">Active Passengers</p>
          <h3 className="analytics_value">{stats.activePassengers}</h3>
        </div>

        <div className="analytics_card">
          <p className="analytics_label">Active Buses</p>
          <h3 className="analytics_value">{stats.activeBuses}</h3>
        </div>

        <div className="analytics_card">
          <p className="analytics_label">Routes</p>
          <h3 className="analytics_value">{stats.routes}</h3>
        </div>
      </div>

      <div className="analytics_panel">
        <h3 className="analytics_title">Students Per Route Per Bus</h3>
        {rows.length === 0 ? (
          <p>No passenger data available.</p>
        ) : (
          <div className="analytics_list">
            {rows.map((row) => (
              <div className="analytics_row" key={`${row.bus}-${row.route}`}>
                <div className="analytics_meta">
                  <p className="analytics_bus">{row.bus}</p>
                  <p className="analytics_route">{row.route}</p>
                </div>
                <div className="analytics_bar_wrap">
                  <div
                    className="analytics_bar"
                    style={{ width: `${(row.students / maxStudents) * 100}%` }}
                  />
                </div>
                <p className="analytics_count">{row.students}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;

