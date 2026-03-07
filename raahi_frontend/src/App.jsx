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
  const [cityNameInput, setCityNameInput] = useState("");
  const [cityPhoneInput, setCityPhoneInput] = useState("");
  const [cityPinInput, setCityPinInput] = useState("");
  const [cityGuardianNameInput, setCityGuardianNameInput] = useState("");
  const [cityGuardianPhoneInput, setCityGuardianPhoneInput] = useState("");
  const [cityGuardianEmailInput, setCityGuardianEmailInput] = useState("");
  const [cityGuardianRelationInput, setCityGuardianRelationInput] = useState("");
  const [cityFromInput, setCityFromInput] = useState("");
  const [cityToInput, setCityToInput] = useState("");
  const [cityJourneyOptions, setCityJourneyOptions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
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
      passengerType: passenger.passengerType || "student",
      phone: passenger.phone || "",
      rollNo: passenger.rollNo || "",
      stopName: passenger.stopName || "",
      destinationStop: passenger.destinationStop || "",
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
    if (userType === "city") {
      delete axios.defaults.headers.common["x-super-admin-key"];
      delete axios.defaults.headers.common["x-organization-code"];

      if (!cityPhoneInput.trim() || !cityPinInput.trim()) {
        alert("Phone and PIN are required.");
        return;
      }
      try {
        const res = await axios.post("/api/city/auth/register-or-login", {
          phone: cityPhoneInput.trim(),
          pin: cityPinInput.trim(),
          name: cityNameInput.trim(),
          gaurdianName: cityGuardianNameInput.trim(),
          gaurdianPhone: cityGuardianPhoneInput.trim(),
          gaurdianEmail: cityGuardianEmailInput.trim(),
          gaurdianRelation: cityGuardianRelationInput.trim()
        });

        const loggedInPassengerId = res.data?.passengerId;
        const directProfile = res.data?.passengerDetails || null;

        if (!loggedInPassengerId || !directProfile) {
          alert("City login failed. Missing passenger profile.");
          return;
        }

        setPassengerId(loggedInPassengerId);
        setPassengerProfile(normalizePassengerProfile(directProfile));
        setCitySuggestions([]);
        setView("city_journey");
      } catch (error) {
        const suggestions = error?.response?.data?.suggestions || [];
        setCitySuggestions(suggestions);
        alert(error?.response?.data?.error || "City passenger login/create failed");
      }
      return;
    }

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
          <option value="city">City Passenger</option>
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

        {userType === "city" && (
          <>
            <label className="entry_label">Name</label>
            <input
              className="entry_input"
              value={cityNameInput}
              onChange={(e) => setCityNameInput(e.target.value)}
              placeholder="Enter full name"
            />
            <label className="entry_label">Phone Number</label>
            <input
              className="entry_input"
              value={cityPhoneInput}
              onChange={(e) => setCityPhoneInput(e.target.value)}
              placeholder="Enter phone number"
            />
            <label className="entry_label">PIN</label>
            <input
              className="entry_input"
              type="password"
              value={cityPinInput}
              onChange={(e) => setCityPinInput(e.target.value)}
              placeholder="Create PIN or login PIN"
            />
            <label className="entry_label">Guardian Name</label>
            <input
              className="entry_input"
              value={cityGuardianNameInput}
              onChange={(e) => setCityGuardianNameInput(e.target.value)}
              placeholder="Required for first-time account"
            />
            <label className="entry_label">Guardian Phone</label>
            <input
              className="entry_input"
              value={cityGuardianPhoneInput}
              onChange={(e) => setCityGuardianPhoneInput(e.target.value)}
              placeholder="Required for first-time account"
            />
            <label className="entry_label">Guardian Email (optional)</label>
            <input
              className="entry_input"
              value={cityGuardianEmailInput}
              onChange={(e) => setCityGuardianEmailInput(e.target.value)}
              placeholder="Optional for first-time account"
            />
            <label className="entry_label">Guardian Relation</label>
            <input
              className="entry_input"
              value={cityGuardianRelationInput}
              onChange={(e) => setCityGuardianRelationInput(e.target.value)}
              placeholder="Father / Mother / Spouse / Other"
            />
            {citySuggestions.length > 0 && (
              <>
                <label className="entry_label">Nearest Available Stops</label>
                <div className="entry_suggestions">
                  {citySuggestions.map((item, idx) => (
                    <button
                      key={`${item.stopName}-${idx}`}
                      className="entry_suggestion_button"
                      type="button"
                      onClick={() => setCityFromInput(item.stopName)}
                    >
                      {item.stopName} ({item.busNumber})
                    </button>
                  ))}
                </div>
              </>
            )}
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

  if (view === "city_journey") {
    content = (
      <div className="entry">
        <div className="entry_card">
          <h2 className="entry_title">City Ride Search</h2>
          <label className="entry_label">From</label>
          <input
            className="entry_input"
            value={cityFromInput}
            onChange={(e) => setCityFromInput(e.target.value)}
            placeholder="Enter pickup location"
          />
          <label className="entry_label">To</label>
          <input
            className="entry_input"
            value={cityToInput}
            onChange={(e) => setCityToInput(e.target.value)}
            placeholder="Enter destination"
          />
          <button
            className="entry_button"
            onClick={async () => {
              if (!cityFromInput.trim() || !cityToInput.trim()) {
                alert("Please enter From and To locations.");
                return;
              }
              try {
                const res = await axios.post("/api/city/journey/search", {
                  passengerId,
                  fromStop: cityFromInput.trim(),
                  toStop: cityToInput.trim()
                });
                setCityJourneyOptions(res.data?.options || []);
              } catch (error) {
                setCityJourneyOptions([]);
                alert(error?.response?.data?.error || "No matching rides found");
              }
            }}
          >
            Search Rides
          </button>

          {cityJourneyOptions.length > 0 && (
            <div className="entry_suggestions">
              {cityJourneyOptions.map((option) => (
                <button
                  key={`${option.routeId}-${option.busId}`}
                  className="entry_suggestion_button"
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await axios.post("/api/city/journey/select", {
                        passengerId,
                        routeId: option.routeId,
                        busId: option.busId,
                        fromStopMatched: option.fromStopMatched,
                        toStopMatched: option.toStopMatched
                      });
                      setPassengerProfile(normalizePassengerProfile(res.data?.passengerDetails));
                      setView("tracking");
                    } catch (error) {
                      alert(error?.response?.data?.error || "Failed to select this ride");
                    }
                  }}
                >
                  {option.fromStopMatched} {"->"} {option.toStopMatched} {"|"} Bus {option.busNumber} {"|"} {option.routeName}
                </button>
              ))}
            </div>
          )}

          <button
            className="entry_button"
            onClick={() => {
              setView("selector");
            }}
          >
            Back
          </button>
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


