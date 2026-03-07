import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const CitySuperAdminDashboard = ({ superAdminKey, onLogout }) => {
  const [activeTab, setActiveTab] = useState("Stops");
  const [stops, setStops] = useState([]);
  const [cityRoutes, setCityRoutes] = useState([]);
  const [stopName, setStopName] = useState("");
  const [stopCity, setStopCity] = useState("");
  const [stopAliases, setStopAliases] = useState("");
  const [stopLatitude, setStopLatitude] = useState("");
  const [stopLongitude, setStopLongitude] = useState("");
  const [stopOrgCode, setStopOrgCode] = useState("");
  const [cityRouteName, setCityRouteName] = useState("");
  const [cityRouteStart, setCityRouteStart] = useState("");
  const [cityRouteEnd, setCityRouteEnd] = useState("");
  const [cityRouteStops, setCityRouteStops] = useState("");
  const [cityRouteOrgCode, setCityRouteOrgCode] = useState("");

  const headers = { "x-super-admin-key": superAdminKey };

  useEffect(() => {
    loadStops();
    loadCityRoutes();
  }, []);

  const loadStops = async () => {
    try {
      const res = await axios.get("/api/super-admin/stops", { headers });
      setStops(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load stops");
    }
  };

  const loadCityRoutes = async () => {
    try {
      const res = await axios.get("/api/super-admin/city-routes", { headers });
      setCityRoutes(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load city routes");
    }
  };

  const createStop = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/api/super-admin/stops",
        {
          name: stopName.trim(),
          city: stopCity.trim(),
          aliases: stopAliases,
          latitude: Number(stopLatitude),
          longitude: Number(stopLongitude),
          organizationCode: stopOrgCode.trim().toLowerCase()
        },
        { headers }
      );
      setStopName("");
      setStopCity("");
      setStopAliases("");
      setStopLatitude("");
      setStopLongitude("");
      setStopOrgCode("");
      loadStops();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create stop");
    }
  };

  const deleteStop = async (id) => {
    if (!window.confirm("Delete this stop?")) return;
    try {
      await axios.delete(`/api/super-admin/stops/${id}`, { headers });
      loadStops();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete stop");
    }
  };

  const createCityRoute = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/api/super-admin/city-routes",
        {
          routeName: cityRouteName.trim(),
          startPoint: cityRouteStart.trim(),
          endPoint: cityRouteEnd.trim(),
          stops: cityRouteStops,
          organizationCode: cityRouteOrgCode.trim().toLowerCase()
        },
        { headers }
      );
      setCityRouteName("");
      setCityRouteStart("");
      setCityRouteEnd("");
      setCityRouteStops("");
      setCityRouteOrgCode("");
      loadCityRoutes();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create city route");
    }
  };

  const deleteCityRoute = async (id) => {
    if (!window.confirm("Delete this city route?")) return;
    try {
      await axios.delete(`/api/super-admin/city-routes/${id}`, { headers });
      loadCityRoutes();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to delete city route");
    }
  };

  return (
    <div className="admin_layout">
      <div className="sidebar">
        <h3 className="sidebar_h3">City Super Admin</h3>
        <ul className="sidebar_ul">
          <li
            className={`sidebar_li ${activeTab === "Stops" ? "sidebar_li_active" : ""}`}
            onClick={() => setActiveTab("Stops")}
          >
            Stops
          </li>
          <li
            className={`sidebar_li ${activeTab === "City Routes" ? "sidebar_li_active" : ""}`}
            onClick={() => setActiveTab("City Routes")}
          >
            City Routes
          </li>
          <li className="sidebar_li" onClick={onLogout}>Logout</li>
        </ul>
      </div>

      <div className="admin_content">
        <h2 className="admin_h2">City Super Admin Panel</h2>

        {activeTab === "Stops" && (
          <>
            <section className="passenger_management" style={{ marginBottom: "16px" }}>
              <div className="pm_header">
                <h2 className="pm_header_h2">Create Stop</h2>
              </div>
              <form className="route_form" onSubmit={createStop}>
                <input
                  className="route_input"
                  placeholder="Stop name"
                  value={stopName}
                  onChange={(e) => setStopName(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="City"
                  value={stopCity}
                  onChange={(e) => setStopCity(e.target.value)}
                />
                <input
                  className="route_input"
                  placeholder="Aliases (comma separated)"
                  value={stopAliases}
                  onChange={(e) => setStopAliases(e.target.value)}
                />
                <input
                  className="route_input"
                  placeholder="Latitude"
                  value={stopLatitude}
                  onChange={(e) => setStopLatitude(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="Longitude"
                  value={stopLongitude}
                  onChange={(e) => setStopLongitude(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="Organization code (optional)"
                  value={stopOrgCode}
                  onChange={(e) => setStopOrgCode(e.target.value)}
                />
                <button className="pm_header_button" type="submit">
                  Create Stop
                </button>
              </form>
            </section>

            <section className="passenger_management">
              <div className="pm_header">
                <h2 className="pm_header_h2">All Stops</h2>
                <button className="pm_header_button" onClick={loadStops}>
                  Refresh
                </button>
              </div>

              <div className="route_table_wrap">
                <table>
                  <thead className="thead">
                    <tr>
                      <th className="th">Name</th>
                      <th className="th">City</th>
                      <th className="th">Organization</th>
                      <th className="th">Latitude</th>
                      <th className="th">Longitude</th>
                      <th className="th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.length === 0 ? (
                      <tr>
                        <td className="td" colSpan="6">No stops found</td>
                      </tr>
                    ) : (
                      stops.map((stop) => (
                        <tr key={stop._id}>
                          <td className="td">{stop.name}</td>
                          <td className="td">{stop.city || "-"}</td>
                          <td className="td">{stop.organizationId?.code || "global"}</td>
                          <td className="td">{stop.location?.coordinates?.[1] ?? "-"}</td>
                          <td className="td">{stop.location?.coordinates?.[0] ?? "-"}</td>
                          <td className="td">
                            <button
                              className="pm_header_button"
                              type="button"
                              onClick={() => deleteStop(stop._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === "City Routes" && (
          <>
            <section className="passenger_management" style={{ marginBottom: "16px" }}>
              <div className="pm_header">
                <h2 className="pm_header_h2">Create City Route</h2>
              </div>
              <form className="route_form" onSubmit={createCityRoute}>
                <input
                  className="route_input"
                  placeholder="Route name"
                  value={cityRouteName}
                  onChange={(e) => setCityRouteName(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="Start point"
                  value={cityRouteStart}
                  onChange={(e) => setCityRouteStart(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="End point"
                  value={cityRouteEnd}
                  onChange={(e) => setCityRouteEnd(e.target.value)}
                  required
                />
                <input
                  className="route_input"
                  placeholder="Stops (comma separated)"
                  value={cityRouteStops}
                  onChange={(e) => setCityRouteStops(e.target.value)}
                />
                <input
                  className="route_input"
                  placeholder="Organization code (optional)"
                  value={cityRouteOrgCode}
                  onChange={(e) => setCityRouteOrgCode(e.target.value)}
                />
                <button className="pm_header_button" type="submit">
                  Create Route
                </button>
              </form>
            </section>

            <section className="passenger_management">
              <div className="pm_header">
                <h2 className="pm_header_h2">All City Routes</h2>
                <button className="pm_header_button" onClick={loadCityRoutes}>
                  Refresh
                </button>
              </div>

              <div className="route_table_wrap">
                <table>
                  <thead className="thead">
                    <tr>
                      <th className="th">Route</th>
                      <th className="th">Start</th>
                      <th className="th">End</th>
                      <th className="th">Stops</th>
                      <th className="th">Organization</th>
                      <th className="th">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cityRoutes.length === 0 ? (
                      <tr>
                        <td className="td" colSpan="6">No city routes found</td>
                      </tr>
                    ) : (
                      cityRoutes.map((route) => (
                        <tr key={route._id}>
                          <td className="td">{route.routeName}</td>
                          <td className="td">{route.startPoint}</td>
                          <td className="td">{route.endPoint}</td>
                          <td className="td">{(route.stops || []).join(", ") || "-"}</td>
                          <td className="td">{route.organizationId?.code || "global"}</td>
                          <td className="td">
                            <button
                              className="pm_header_button"
                              type="button"
                              onClick={() => deleteCityRoute(route._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default CitySuperAdminDashboard;
