import { useEffect, useState } from "react";
import axios from "axios";
import "./admin.css";

const ReportedIssues = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("24h");

  const loadReports = async () => {
    try {
      const res = await axios.get("/api/reports", {
        params: { range }
      });
      setReports(res.data || []);
    } catch (error) {
      console.error("Failed to load reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    const t = setInterval(loadReports, 10000);
    return () => clearInterval(t);
  }, [range]);

  return (
    <div className="sos_alerts">
      <div className="sos_alerts_header">
        <h3>Reported Issues</h3>
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
          <button className="pm_header_button" onClick={loadReports}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading reports...</p>
      ) : (
        <div className="route_table_wrap">
          <table>
            <thead className="thead">
              <tr>
                <th className="th">Passenger</th>
                <th className="th">Roll No</th>
                <th className="th">Stop</th>
                <th className="th">Bus</th>
                <th className="th">Issue</th>
                <th className="th">Details</th>
                <th className="th">Time</th>
                <th className="th">Location</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td className="td" colSpan="8">No reports yet</td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r._id}>
                    <td className="td">{r.passengerName}</td>
                    <td className="td">{r.rollNo}</td>
                    <td className="td">{r.stopName}</td>
                    <td className="td">{r.busId}</td>
                    <td className="td">{r.category}</td>
                    <td className="td">{r.message}</td>
                    <td className="td">{new Date(r.reportedAt).toLocaleString()}</td>
                    <td className="td">
                      <a className="sos_link" href={r.locationLink} target="_blank" rel="noreferrer">
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

export default ReportedIssues;
