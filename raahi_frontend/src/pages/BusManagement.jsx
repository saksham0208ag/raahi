import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const BusManagement = () => {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState({
    busNumber: "",
    type: "INSTITUTION",
    status: "running",
    route: ""
  });

  const loadData = async () => {
    try {
      const [busRes, routeRes] = await Promise.all([
        axios.get("/api/buses"),
        axios.get("/api/routes")
      ]);
      setBuses(busRes.data || []);
      setRoutes(routeRes.data || []);
    } catch (error) {
      console.error("Failed to load buses/routes", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddBus = async (e) => {
    e.preventDefault();

    if (!form.busNumber.trim()) {
      alert("Bus number is required");
      return;
    }

    try {
      await axios.post("/api/buses/add", {
        busNumber: form.busNumber.trim(),
        type: form.type,
        status: form.status,
        route: form.route || undefined
      });
      setForm({
        busNumber: "",
        type: "INSTITUTION",
        status: "running",
        route: ""
      });
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to add bus");
    }
  };

  const statusLabel = (status) => {
    if (status === "not_in_use") return "Not In Use";
    if (status === "maintenance") return "Maintenance";
    if (status === "running") return "Running";
    return status || "-";
  };

  return (
    <div className="bus_mgmt">
      <h3 className="route_mgmt_title">Bus Management</h3>

      <form className="bus_form" onSubmit={handleAddBus}>
        <input
          className="route_input"
          placeholder="Bus Number"
          value={form.busNumber}
          onChange={(e) => setForm((p) => ({ ...p, busNumber: e.target.value }))}
        />

        <select
          className="route_select"
          value={form.type}
          onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
        >
          <option value="INSTITUTION">Institution</option>
          <option value="CITY">City</option>
        </select>

        <select
          className="route_select"
          value={form.status}
          onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
        >
          <option value="running">Running</option>
          <option value="maintenance">Maintenance</option>
          <option value="not_in_use">Not In Use</option>
        </select>

        <select
          className="route_select"
          value={form.route}
          onChange={(e) => setForm((p) => ({ ...p, route: e.target.value }))}
        >
          <option value="">No Route</option>
          {routes.map((r) => (
            <option key={r._id} value={r._id}>
              {r.routeName}
            </option>
          ))}
        </select>

        <button className="pm_header_button" type="submit">
          Add Bus
        </button>
      </form>

      <div className="route_table_wrap">
        <table>
          <thead className="thead">
            <tr>
              <th className="th">Bus Number</th>
              <th className="th">Type</th>
              <th className="th">Status</th>
              <th className="th">Route</th>
            </tr>
          </thead>
          <tbody>
            {buses.length === 0 ? (
              <tr>
                <td className="td" colSpan="4">No buses found</td>
              </tr>
            ) : (
              buses.map((bus) => (
                <tr key={bus._id}>
                  <td className="td">{bus.busNumber}</td>
                  <td className="td">{bus.type || "-"}</td>
                  <td className="td">{statusLabel(bus.status)}</td>
                  <td className="td">{bus.route?.routeName || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusManagement;

