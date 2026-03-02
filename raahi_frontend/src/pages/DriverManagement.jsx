import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./admin.css";

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [selectedBusByDriver, setSelectedBusByDriver] = useState({});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    licenseNumber: "",
    driverCode: ""
  });

  const loadData = async () => {
    try {
      const [driverRes, busRes] = await Promise.all([
        axios.get("/api/drivers"),
        axios.get("/api/buses")
      ]);
      setDrivers(driverRes.data || []);
      setBuses(busRes.data || []);
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to load driver data");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableBuses = useMemo(
    () => buses.filter((b) => b.status !== "not_in_use"),
    [buses]
  );

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/drivers", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        licenseNumber: form.licenseNumber.trim(),
        driverCode: form.driverCode.trim().toLowerCase()
      });
      setForm({ name: "", phone: "", licenseNumber: "", driverCode: "" });
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to create driver");
    }
  };

  const assignBus = async (driverId) => {
    const busId = selectedBusByDriver[driverId];
    if (!busId) {
      alert("Select a bus first");
      return;
    }
    try {
      await axios.put("/api/drivers/assign-bus", { driverId, busId });
      loadData();
    } catch (error) {
      alert(error?.response?.data?.error || "Failed to assign bus");
    }
  };

  return (
    <div className="route_mgmt">
      <h3 className="route_mgmt_title">Driver Management</h3>

      <form className="route_form" onSubmit={handleCreateDriver}>
        <input
          className="route_input"
          placeholder="Driver Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          required
        />
        <input
          className="route_input"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          required
        />
        <input
          className="route_input"
          placeholder="License Number"
          value={form.licenseNumber}
          onChange={(e) => setForm((p) => ({ ...p, licenseNumber: e.target.value }))}
          required
        />
        <input
          className="route_input"
          placeholder="Driver Login Code (unique)"
          value={form.driverCode}
          onChange={(e) => setForm((p) => ({ ...p, driverCode: e.target.value }))}
          required
        />
        <button className="pm_header_button" type="submit">Add Driver</button>
      </form>

      <div className="route_table_wrap">
        <table>
          <thead className="thead">
            <tr>
              <th className="th">Driver</th>
              <th className="th">Phone</th>
              <th className="th">Code</th>
              <th className="th">Assigned Bus</th>
              <th className="th">Assign / Change Bus</th>
            </tr>
          </thead>
          <tbody>
            {drivers.length === 0 ? (
              <tr>
                <td className="td" colSpan="5">No drivers found</td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver._id}>
                  <td className="td">{driver.name}</td>
                  <td className="td">{driver.phone}</td>
                  <td className="td">{driver.driverCode}</td>
                  <td className="td">{driver.assignedBus?.busNumber || "Not Assigned"}</td>
                  <td className="td">
                    <div className="route_assign">
                      <select
                        className="route_select"
                        value={selectedBusByDriver[driver._id] || ""}
                        onChange={(e) =>
                          setSelectedBusByDriver((prev) => ({ ...prev, [driver._id]: e.target.value }))
                        }
                      >
                        <option value="">Select bus</option>
                        {availableBuses.map((bus) => (
                          <option key={bus._id} value={bus._id}>
                            {bus.busNumber}
                          </option>
                        ))}
                      </select>
                      <button className="pm_header_button" type="button" onClick={() => assignBus(driver._id)}>
                        Assign
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DriverManagement;
