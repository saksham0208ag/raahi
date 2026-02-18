import { useEffect, useState } from "react";
import axios from "axios";
import PassengerTable from "../components/PassengerTable";
import AddPassengerModal from "../components/AddPassengerModal";
import "./admin.css"; 

const PassengerManagement = () => {
  const [passengers, setPassengers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [searchText, setSearchText] = useState("");


  const handleSave=()=>{
    if(editData){
      setPassengers(passengers.map(p=>p.id===editData.id ? data:p));
    }else{
      setPassengers([...passengers,{
        ...data,id:Data.now()
      }]);
    }
    setEditData(null);
  };

  /* ===== FETCH ===== */
  const fetchPassengers = async () => {
    try {
      const res = await axios.get("/api/passengers");
      setPassengers(res.data);
    } catch (error) {
      console.error("Failed to fetch passengers", error);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  /* ====== ADD ====== */
  const addPassenger = async (data) => {
    try {
      await axios.post("/api/passengers", data);
      setShowModal(false);
      fetchPassengers();
    } catch (error) {
      console.error("Failed to add passenger", error?.response?.data || error.message);
      alert(error?.response?.data?.error || "Failed to add passenger");
    }
  };

  /* ====UPDATE ====== */
  const updatePassenger = async (id, data) => {
    try {
      await axios.put(
       `/api/passengers/${id}`,
        data
      );
      setEditData(null);
      fetchPassengers();
    } catch (error) {
      console.error("Failed to update passenger", error?.response?.data || error.message);
      alert(error?.response?.data?.error || "Failed to update passenger");
    }
  };

  /* ==== DELETE ===*/
  const deletePassenger = async (id) => {
    if (!window.confirm("Are you sure you want to delete?")) return;

    try {
      await axios.delete(
       `/api/passengers/${id}`
      );
      fetchPassengers();
    } catch (error) {
      console.error("Failed to delete passenger", error?.response?.data || error.message);
      alert(error?.response?.data?.error || "Failed to delete passenger");
    }
  };

  const togglePassengerStatus = async (passenger) => {
    const nextStatus = (passenger.status || "active") === "active" ? "inactive" : "active";
    try {
      await axios.put(`/api/passengers/${passenger._id || passenger.id}`, {
        status: nextStatus
      });
      fetchPassengers();
    } catch (error) {
      console.error("Failed to toggle passenger status", error?.response?.data || error.message);
      alert(error?.response?.data?.error || "Failed to update status");
    }
  };

  const filteredPassengers = passengers.filter((p) => {
    const q = searchText.trim().toLowerCase();
    if (!q) return true;

    const name = String(p.name || "").toLowerCase();
    const rollNo = String(p.rollNo || p.roll || "").toLowerCase();
    return name.includes(q) || rollNo.includes(q);
  });

  return (
    <div className="passenger_management">
      <div className="pm_header">
        <h2 className="pm_header_h2">Passenger Management</h2>
        <button onClick={() => setShowModal(true)} className="pm_header_button">
          + Add Passenger
        </button>
      </div>

      <div className="pm_search_wrap">
        <input
          className="pm_search_input"
          type="text"
          placeholder="Search by name or roll number"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <PassengerTable
        passengers={filteredPassengers}
        onDelete={deletePassenger}
        onToggleStatus={togglePassengerStatus}
        onEdit={(data) => {
          setEditData(data);
          setShowModal(true);
        }}
      />

      {showModal && (
        <AddPassengerModal
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSave={editData ? updatePassenger : addPassenger}
          editData={editData}
        />
      )}
    </div>
  );
};

export default PassengerManagement;

