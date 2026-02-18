import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./admin.css";

const RouteManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBusByRoute, setSelectedBusByRoute] = useState({});
  const [form, setForm] = useState({
    routeName: "",
    startPoint: "",
    endPoint: "",
    stopInput: ""
  });

  const loadData = async () => {
    try {
      const [routeRes, busRes] = await Promise.all([
        axios.get("/api/routes"),
        axios.get("/api/buses")
      ]);
      setRoutes(routeRes.data || []);
      setBuses(busRes.data || []);
    } catch (error) {
      console.error("Failed to load routes/buses", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stopsPreview = useMemo(
    () =>
      form.stopInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [form.stopInput]
  );

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    const payload = {
      routeName: form.routeName.trim(),
      startPoint: form.startPoint.trim(),
      endPoint: form.endPoint.trim(),
      stops: stopsPreview
    };

    if (!payload.routeName || !payload.startPoint || !payload.endPoint || payload.stops.length === 0) {
      alert("Route name, start point, end point and at least one stop are required");
      return;
    }

    try {
      await axios.post("/api/routes/add", payload);
      setForm({ routeName: "", startPoint: "", endPoint: "", stopInput: "" });
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create route");
    }
  };

  const handleAssignBus = async (routeId) => {
    const busId = selectedBusByRoute[routeId];
    if (!busId) {
      alert("Select a bus first");
      return;
    }
    try {
      await axios.put("/api/buses/assign-route", { busId, routeId });
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to assign bus");
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!window.confirm("Delete this route? Assigned buses/passengers will be unlinked.")) {
      return;
    }
    try {
      await axios.delete(`/api/routes/${routeId}`);
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete route");
    }
  };

  return (
    <div className="route_mgmt">
      <h3 className="route_mgmt_title">Route Management</h3>

      <form className="route_form" onSubmit={handleCreateRoute}>
        <input
          className="route_input"
          placeholder="Route Name"
          value={form.routeName}
          onChange={(e) => setForm((p) => ({ ...p, routeName: e.target.value }))}
        />
        <input
          className="route_input"
          placeholder="Start Point"
          value={form.startPoint}
          onChange={(e) => setForm((p) => ({ ...p, startPoint: e.target.value }))}
        />
        <input
          className="route_input"
          placeholder="End Point"
          value={form.endPoint}
          onChange={(e) => setForm((p) => ({ ...p, endPoint: e.target.value }))}
        />
        <input
          className="route_input"
          placeholder="Stops (comma separated: Stop A, Stop B, Stop C)"
          value={form.stopInput}
          onChange={(e) => setForm((p) => ({ ...p, stopInput: e.target.value }))}
        />
        <button className="pm_header_button" type="submit">Add Route</button>
      </form>

      <div className="route_table_wrap">
        <table>
          <thead className="thead">
            <tr>
              <th className="th">Route</th>
              <th className="th">Stops</th>
              <th className="th">Assigned Bus</th>
              <th className="th">Assign / Change Bus</th>
              <th className="th">Delete</th>
            </tr>
          </thead>
          <tbody>
            {routes.length === 0 ? (
              <tr>
                <td className="td" colSpan="5">No routes found</td>
              </tr>
            ) : (
              routes.map((route) => {
                const assignedBus = buses.find((b) => String(b.route?._id || b.route) === String(route._id));
                return (
                  <tr key={route._id}>
                    <td className="td">{route.routeName}</td>
                    <td className="td">{(route.stops || []).join(", ") || "-"}</td>
                    <td className="td">{assignedBus?.busNumber || "Not Assigned"}</td>
                    <td className="td">
                      <div className="route_assign">
                        <select
                          className="route_select"
                          value={selectedBusByRoute[route._id] || ""}
                          onChange={(e) =>
                            setSelectedBusByRoute((prev) => ({ ...prev, [route._id]: e.target.value }))
                          }
                        >
                          <option value="">Select bus</option>
                          {buses.map((bus) => (
                            <option key={bus._id} value={bus._id}>
                              {bus.busNumber}
                            </option>
                          ))}
                        </select>
                        <button
                          className="pm_header_button"
                          type="button"
                          onClick={() => handleAssignBus(route._id)}
                        >
                          Assign
                        </button>
                      </div>
                    </td>
                    <td className="td">
                      <button
                        className="pm_header_button"
                        type="button"
                        onClick={() => handleDeleteRoute(route._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RouteManagement;

