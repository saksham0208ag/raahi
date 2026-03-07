import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const SuperAdminDashboard = ({ superAdminKey, onLogout }) => {
  const [activeTab, setActiveTab] = useState("Organizations");
  const [organizations, setOrganizations] = useState([]);
  const [stops, setStops] = useState([]);
  const [cityRoutes, setCityRoutes] = useState([]);
  const [planCatalog, setPlanCatalog] = useState({});
  const [planDetails, setPlanDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("trial");
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

  const loadOrganizations = async () => {
    try {
      const res = await axios.get("/api/organizations", { headers });
      setOrganizations(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
    loadPlans();
    loadStops();
    loadCityRoutes();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await axios.get("/api/organizations/plans");
      setPlanCatalog(res.data?.plans || {});
      setPlanDetails(res.data?.details || {});
    } catch (_) {}
  };

  const createOrganization = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/api/organizations/register",
        {
          name: name.trim(),
          code: code.trim().toLowerCase(),
          plan
        },
        { headers }
      );
      setName("");
      setCode("");
      setPlan("trial");
      loadOrganizations();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create organization");
    }
  };

  const toggleStatus = async (org) => {
    try {
      setUpdatingId(org._id);
      await axios.put(
        `/api/organizations/${org._id}/status`,
        { status: "toggle" },
        { headers }
      );
      loadOrganizations();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to update organization status");
    } finally {
      setUpdatingId("");
    }
  };

  const loadStops = async () => {
    try {
      const res = await axios.get("/api/super-admin/stops", { headers });
      setStops(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load stops");
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

  const loadCityRoutes = async () => {
    try {
      const res = await axios.get("/api/super-admin/city-routes", { headers });
      setCityRoutes(res.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load city routes");
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
        <h3 className="sidebar_h3">Platform Admin</h3>
        <ul className="sidebar_ul">
          <li
            className={`sidebar_li ${activeTab === "Organizations" ? "sidebar_li_active" : ""}`}
            onClick={() => setActiveTab("Organizations")}
          >
            Organizations
          </li>
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
        <h2 className="admin_h2">Super Admin Panel</h2>

        {activeTab === "Organizations" && (
        <>
        <section className="passenger_management" style={{ marginBottom: "16px" }}>
          <div className="pm_header">
            <h2 className="pm_header_h2">Create Organization</h2>
          </div>
          <form className="route_form" onSubmit={createOrganization}>
            <input
              className="route_input"
              placeholder="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="route_input"
              placeholder="Organization code (unique)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <select
              className="route_select"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
            >
              <option value="trial">Trial</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button className="pm_header_button" type="submit">
              Create
            </button>
          </form>
        </section>

        <section className="passenger_management" style={{ marginBottom: "16px" }}>
          <div className="pm_header">
            <h2 className="pm_header_h2">Plan Manual</h2>
          </div>
          <div className="route_table_wrap">
            <table>
              <thead className="thead">
                <tr>
                  <th className="th">Plan</th>
                  <th className="th">Best For</th>
                  <th className="th">Bus Limit</th>
                  <th className="th">Passenger Limit</th>
                  <th className="th">Route Limit</th>
                  <th className="th">Notes</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(planCatalog).length === 0 ? (
                  <tr>
                    <td className="td" colSpan="6">Unable to load plan manual</td>
                  </tr>
                ) : (
                  Object.entries(planCatalog).map(([planKey, limits]) => (
                    <tr key={planKey}>
                      <td className="td">{planDetails?.[planKey]?.name || planKey}</td>
                      <td className="td">{planDetails?.[planKey]?.bestFor || "-"}</td>
                      <td className="td">{Number.isFinite(limits.maxBuses) ? limits.maxBuses : "Unlimited"}</td>
                      <td className="td">{Number.isFinite(limits.maxPassengers) ? limits.maxPassengers : "Unlimited"}</td>
                      <td className="td">{Number.isFinite(limits.maxRoutes) ? limits.maxRoutes : "Unlimited"}</td>
                      <td className="td">
                        {(planDetails?.[planKey]?.limitations || []).join(", ") || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="passenger_management">
          <div className="pm_header">
            <h2 className="pm_header_h2">All Organizations</h2>
            <button className="pm_header_button" onClick={loadOrganizations}>
              Refresh
            </button>
          </div>

          {loading ? (
            <p>Loading organizations...</p>
          ) : (
            <div className="route_table_wrap">
              <table>
                <thead className="thead">
                <tr>
                  <th className="th">Name</th>
                  <th className="th">Code</th>
                  <th className="th">Plan</th>
                  <th className="th">Status</th>
                  <th className="th">Subscription Ends</th>
                </tr>
              </thead>
                <tbody>
                  {organizations.length === 0 ? (
                    <tr>
                      <td className="td" colSpan="5">No organizations found</td>
                    </tr>
                  ) : (
                    organizations.map((org) => (
                      <tr key={org._id}>
                        <td className="td">{org.name}</td>
                        <td className="td">{org.code}</td>
                        <td className="td">{org.plan}</td>
                        <td className="td">
                          <button
                            type="button"
                            className={`status_button ${
                              org.status === "active" ? "status_active" : "status_inactive"
                            }`}
                            onClick={() => toggleStatus(org)}
                            disabled={updatingId === org._id}
                            title="Click to toggle status"
                          >
                            {updatingId === org._id ? "Updating..." : org.status}
                          </button>
                        </td>
                        <td className="td">
                          {new Date(org.subscriptionEndsAt || org.trialEndsAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>
        )}

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

export default SuperAdminDashboard;
