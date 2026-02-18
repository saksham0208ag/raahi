import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const SosAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("24h");

  const loadAlerts = async () => {
    try {
      const res = await axios.get("/api/sos", {
        params: { range }
      });
      setAlerts(res.data || []);
    } catch (error) {
      console.error("Failed to load SOS alerts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const t = setInterval(loadAlerts, 10000);
    return () => clearInterval(t);
  }, [range]);

  return (
    <div className="sos_alerts">
      <div className="sos_alerts_header">
        <h3>SOS Alerts</h3>
        <div className="sos_filters">
          <select
            className="route_select"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="24h">Past 24 Hours</option>
            <option value="1w">Past 1 Week</option>
            <option value="1m">Past 1 Month</option>
            <option value="1y">Past 1 Year</option>
          </select>
          <button className="pm_header_button" onClick={loadAlerts}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading alerts...</p>
      ) : (
        <div className="route_table_wrap">
          <table>
            <thead className="thead">
              <tr>
                <th className="th">Passenger</th>
                <th className="th">Roll No</th>
                <th className="th">Stop</th>
                <th className="th">Bus</th>
                <th className="th">Time</th>
                <th className="th">Location</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr>
                  <td className="td" colSpan="6">No SOS alerts yet</td>
                </tr>
              ) : (
                alerts.map((a) => (
                  <tr key={a._id}>
                    <td className="td">{a.passengerName}</td>
                    <td className="td">{a.rollNo}</td>
                    <td className="td">{a.stopName}</td>
                    <td className="td">{a.busId}</td>
                    <td className="td">{new Date(a.time || a.triggeredAt).toLocaleString()}</td>
                    <td className="td">
                      <a className="sos_link" href={a.locationLink} target="_blank" rel="noreferrer">
                        Open Map
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SosAlerts;

