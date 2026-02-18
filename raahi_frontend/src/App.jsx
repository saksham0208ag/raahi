import { useEffect, useState } from "react";
import axios from "axios";
import AdminDashboard from "./pages/AdminDashboard";
import BusTracking from "./components/BusTracking";
import "./App.css";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [userType, setUserType] = useState("organisation");
  const [orgRole, setOrgRole] = useState("admin");
  const [passengerIdInput, setPassengerIdInput] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [view, setView] = useState("selector");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleContinue = async () => {
    if (userType === "organisation" && orgRole === "admin") {
      setView("admin");
      return;
    }

    if (!passengerIdInput.trim()) {
      alert("Roll Number is required for tracking and SOS.");
      return;
    }

    try {
      const res = await axios.post("/api/auth/login", {
        role: "regular",
        userId: passengerIdInput.trim()
      });

      setPassengerId(res.data.passengerId);
      setView("tracking");
    } catch (error) {
      alert(error?.response?.data?.message || "Invalid Roll Number / Passenger ID");
    }
  };

  let content = null;
  if (view === "admin") {
    content = <AdminDashboard />;
  } else if (view === "tracking") {
    content = <BusTracking passengerId={passengerId.trim()} theme={theme} />;
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
        </select>

        {userType === "organisation" && (
          <>
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

        {(userType === "regular" || orgRole === "student_employee") && (
          <>
            <label className="entry_label">Roll Number</label>
            <input
              className="entry_input"
              value={passengerIdInput}
              onChange={(e) => setPassengerIdInput(e.target.value)}
              placeholder="Enter rollNo (or passenger ID)"
            />
          </>
        )}

        <button className="entry_button" onClick={handleContinue}>
          Continue
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

