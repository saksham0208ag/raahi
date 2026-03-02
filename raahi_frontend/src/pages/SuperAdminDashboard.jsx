import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const SuperAdminDashboard = ({ superAdminKey, onLogout }) => {
  const [organizations, setOrganizations] = useState([]);
  const [planCatalog, setPlanCatalog] = useState({});
  const [planDetails, setPlanDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState("trial");

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

  return (
    <div className="admin_layout">
      <div className="sidebar">
        <h3 className="sidebar_h3">Platform Admin</h3>
        <ul className="sidebar_ul">
          <li className="sidebar_li sidebar_li_active">Organizations</li>
          <li className="sidebar_li" onClick={onLogout}>Logout</li>
        </ul>
      </div>

      <div className="admin_content">
        <h2 className="admin_h2">Super Admin Panel</h2>

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
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
