const PassengerTable = ({ passengers = [], onEdit, onDelete, onToggleStatus }) => {
  return (
    <table>
      <thead className="thead">
        <tr>
          <th className="th">Name</th>
          <th className="th">Roll</th>
          <th className="th">Stop</th>
          <th className="th">Bus</th>
          <th className="th">Status</th>
          <th className="th">Actions</th>
        </tr>
      </thead>
      <tbody>
        {passengers.length === 0 ? (
          <tr>
            <td className="td" colSpan="6">No passengers found</td>
          </tr>
        ) : (
          passengers.map((p) => (
            <tr key={p._id || p.id}>
              <td className="td">{p.name || "-"}</td>
              <td className="td">{p.rollNo || p.roll || "-"}</td>
              <td className="td">{p.stopName || "-"}</td>
              <td className="td">
                {typeof p.bus === "string" ? p.bus : p.bus?.busNumber || p.bus?._id || "-"}
              </td>
              <td className="td">
                <button
                  className={`status_button ${(p.status || "active") === "active" ? "status_active" : "status_inactive"}`}
                  onClick={() => onToggleStatus && onToggleStatus(p)}
                >
                  {(p.status || "active") === "active" ? "Active" : "Inactive"}
                </button>
              </td>
              <td className="td">
                <button className="modal_button" onClick={() => onEdit && onEdit(p)}>
                  Edit
                </button>
                <button className="modal_button" onClick={() => onDelete && onDelete(p._id || p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default  PassengerTable;
