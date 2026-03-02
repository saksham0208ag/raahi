import { useEffect, useState } from "react";
import axios from "axios";
import AdminDashboard from "./pages/AdminDashboard";
import BusTracking from "./components/BusTracking";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DriverTracking from "./pages/DriverTracking";
import "./App.css";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [userType, setUserType] = useState("organisation");
  const [orgRole, setOrgRole] = useState("admin");
  const [organizationCodeInput, setOrganizationCodeInput] = useState("");
  const [superAdminKeyInput, setSuperAdminKeyInput] = useState("");
  const [driverCodeInput, setDriverCodeInput] = useState("");
  const [passengerIdInput, setPassengerIdInput] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [passengerProfile, setPassengerProfile] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [view, setView] = useState("selector");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const normalizePassengerProfile = (passenger) => {
    if (!passenger) return null;
    return {
      id: passenger._id || passenger.id || "",
      name: passenger.name || "",
      rollNo: passenger.rollNo || "",
      stopName: passenger.stopName || "",
      status: passenger.status || "",
      busId: passenger.bus?._id || passenger.bus || null,
      busNumber: passenger.bus?.busNumber || "",
      routeId: passenger.route?._id || passenger.route || null,
      routeName: passenger.route?.routeName || "",
      routeStartPoint: passenger.route?.startPoint || "",
      routeEndPoint: passenger.route?.endPoint || "",
      routeStops: Array.isArray(passenger.route?.stops) ? passenger.route.stops : [],
      guardianName: passenger.gaurdian?.name || "",
      guardianPhone: passenger.gaurdian?.phone || "",
      guardianEmail: passenger.gaurdian?.email || ""
    };
  };

  const fetchPassengerProfileById = async (id) => {
    if (!id) return null;
    try {
      const res = await axios.get("/api/passengers");
      const matched = (res.data || []).find((item) => String(item._id || item.id) === String(id));
      return normalizePassengerProfile(matched);
    } catch (error) {
      return null;
    }
  };

  const handleContinue = async () => {
    if (userType === "super_admin") {
      const superAdminKey = superAdminKeyInput.trim();
      if (!superAdminKey) {
        alert("Super admin key is required.");
        return;
      }

      delete axios.defaults.headers.common["x-organization-code"];
      axios.defaults.headers.common["x-super-admin-key"] = superAdminKey;

      try {
        await axios.get("/api/organizations", {
          headers: { "x-super-admin-key": superAdminKey }
        });
        setView("super_admin");
      } catch (error) {
        alert(error?.response?.data?.error || "Invalid super admin key");
      }
      return;
    }

    const organizationCode = organizationCodeInput.trim().toLowerCase();
    if (!organizationCode) {
      alert("Organization code is required.");
      return;
    }

    delete axios.defaults.headers.common["x-super-admin-key"];
    axios.defaults.headers.common["x-organization-code"] = organizationCode;

    if (userType === "organisation" && orgRole === "admin") {
      try {
        await axios.get("/api/organizations/resolve", {
          params: { code: organizationCode }
        });
        setView("admin");
      } catch (error) {
        alert(error?.response?.data?.error || "Invalid organization code");
      }
      return;
    }

    if (userType === "driver") {
      if (!driverCodeInput.trim()) {
        alert("Driver code is required.");
        return;
      }
      try {
        const res = await axios.post("/api/auth/login", {
          role: "driver",
          userId: driverCodeInput.trim(),
          organizationCode
        });
        setDriverProfile({
          ...(res.data?.driverDetails || {}),
          buses: res.data?.buses || []
        });
        setView("driver");
      } catch (error) {
        alert(error?.response?.data?.message || error?.response?.data?.error || "Driver login failed");
      }
      return;
    }

    if (!passengerIdInput.trim()) {
      alert("Roll Number is required for tracking and SOS.");
      return;
    }

    try {
      const res = await axios.post("/api/auth/login", {
        role: "regular",
        userId: passengerIdInput.trim(),
        organizationCode
      });

      const loggedInPassengerId = res.data.passengerId;
      const directProfile = res.data.passengerDetails || null;
      const fallbackProfile = directProfile || await fetchPassengerProfileById(loggedInPassengerId);

      setPassengerId(loggedInPassengerId);
      setPassengerProfile(fallbackProfile);
      setView("tracking");
    } catch (error) {
      alert(error?.response?.data?.message || "Invalid Roll Number / Passenger ID");
    }
  };

  let content = null;
  if (view === "admin") {
    content = <AdminDashboard />;
  } else if (view === "super_admin") {
    content = (
      <SuperAdminDashboard
        superAdminKey={superAdminKeyInput.trim()}
        onLogout={() => window.location.reload()}
      />
    );
  } else if (view === "driver") {
    content = (
      <DriverTracking
        driverProfile={driverProfile}
        onLogout={() => window.location.reload()}
      />
    );
  } else if (view === "tracking") {
    content = (
      <BusTracking
        passengerId={passengerId.trim()}
        passengerProfile={passengerProfile}
        theme={theme}
      />
    );
  } else {
    content = (
    <div className="entry">
      <div className="entry_card">
        <h2 className="entry_title">Raahi Access</h2>

        <label className="entry_label">Select user type</label>
        <select
          className="entry_select"
          value={userType}
          onChange={(e) => setUserType(e.target.value)}
        >
          <option value="organisation">Organisation / College</option>
          <option value="regular">Regular</option>
          <option value="driver">Driver</option>
          <option value="super_admin">Super Admin</option>
        </select>

        {userType === "organisation" && (
          <>
            <label className="entry_label">Organization Code</label>
            <input
              className="entry_input"
              value={organizationCodeInput}
              onChange={(e) => setOrganizationCodeInput(e.target.value)}
              placeholder="Enter organization code (e.g. acme-college)"
            />

            <label className="entry_label">Select organisation role</label>
            <select
              className="entry_select"
              value={orgRole}
              onChange={(e) => setOrgRole(e.target.value)}
            >
              <option value="admin">Admin</option>
              <option value="student_employee">Student / Employee</option>
            </select>
          </>
        )}

        {userType === "super_admin" && (
          <>
            <label className="entry_label">Super Admin Key</label>
            <input
              className="entry_input"
              value={superAdminKeyInput}
              onChange={(e) => setSuperAdminKeyInput(e.target.value)}
              placeholder="Enter super admin key"
            />
          </>
        )}

        {(userType === "regular" || orgRole === "student_employee") && (
          <>
            {userType === "regular" && (
              <>
                <label className="entry_label">Organization Code</label>
                <input
                  className="entry_input"
                  value={organizationCodeInput}
                  onChange={(e) => setOrganizationCodeInput(e.target.value)}
                  placeholder="Enter organization code"
                />
              </>
            )}
            <label className="entry_label">Roll Number</label>
            <input
              className="entry_input"
              value={passengerIdInput}
              onChange={(e) => setPassengerIdInput(e.target.value)}
              placeholder="Enter rollNo (or passenger ID)"
            />
          </>
        )}

        {userType === "driver" && (
          <>
            <label className="entry_label">Organization Code</label>
            <input
              className="entry_input"
              value={organizationCodeInput}
              onChange={(e) => setOrganizationCodeInput(e.target.value)}
              placeholder="Enter organization code"
            />
            <label className="entry_label">Driver Code</label>
            <input
              className="entry_input"
              value={driverCodeInput}
              onChange={(e) => setDriverCodeInput(e.target.value)}
              placeholder="Enter driver login code"
            />
          </>
        )}

        <button className="entry_button" onClick={handleContinue}>
          Continue
        </button>
      </div>
      <div className="entry_ticker" aria-label="Copyright notice">
        <p className="entry_ticker_text">
          Copyright is secured by the developers: Saksham Agarwal, Khushi Jangid, and Mohit Kumar.
        </p>
      </div>
    </div>
    );
  }

  return (
    <>
      <button
        className={`theme_toggle ${view === "tracking" ? "theme_toggle_tracking" : ""}`}
        onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      >
        {theme === "dark" ? "Light Mode" : "Dark Mode"}
      </button>
      {content}
    </>
  );
}

export default App;


