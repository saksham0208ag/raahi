import { useState,useEffect} from 'react';

const AddPassengerModal = ({ onClose,onSave,editData }) => {
  const initialFormData = {
    name: "",
    rollNo: "",
    stopName: "",
    department: "",
    email: "",
    gaurdianName: "",
    gaurdianPhone: "",
    gaurdianEmail: ""
  };

  const [formData,setFormData]=useState({
    ...initialFormData
  });

  useEffect(()=>{
    if(editData){
      setFormData({
        ...initialFormData,
        ...editData,
        rollNo: editData.rollNo || editData.roll || editData.rollno || editData.rollNumber || editData.roll_no || "",
        stopName: editData.stopName || "",
        gaurdianName: editData.gaurdian?.name || editData.guardian?.name || editData.gaurdianName || editData.guardianName || "",
        gaurdianPhone: editData.gaurdian?.phone || editData.guardian?.phone || editData.gaurdianPhone || editData.guardianPhone || "",
        gaurdianEmail: editData.gaurdian?.email || editData.guardian?.email || editData.gaurdianEmail || editData.guardianEmail || ""
      });
    } else {
      setFormData(initialFormData);
    }
  },[editData]);

  const handleChange=(e)=>{
    setFormData({
      ...formData,
      [e.target.name]:e.target.value
    });
  };

  const handleSubmit=async(e)=>{
    e.preventDefault();
    try {
      const payload = {
        name: (formData.name || "").trim(),
        rollNo: formData.rollNo || formData.roll || formData.rollno || formData.rollNumber || formData.roll_no,
        stopName: (formData.stopName || "").trim(),
        gaurdianName: (formData.gaurdianName || "").trim(),
        gaurdianPhone: (formData.gaurdianPhone || "").trim(),
        gaurdianEmail: (formData.gaurdianEmail || "").trim()
      };
      payload.rollNo = (payload.rollNo || "").trim();

      if (!payload.name || !payload.rollNo || !payload.stopName) {
        alert("Name, Roll Number and Stop Name are required");
        return;
      }
      if (!payload.gaurdianName || !payload.gaurdianPhone || !payload.gaurdianEmail) {
        alert("Guardian name, phone and email are required");
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(payload.gaurdianEmail)) {
        alert("Enter a valid guardian email");
        return;
      }

      if (editData && (editData._id || editData.id)) {
        await onSave(editData._id || editData.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    }catch(error){
      console.log("Add Passenger Error:",error.response || error.message);
      alert(error?.response?.data?.error || "failed to add passenger");
    }
  };

  return (
    <div className="modal_backdrop">
      <div className="modal">
        <h3 className="modal_h3">{editData ? "Edit Student":'Add Student'}</h3>

        <input className="modal_input" placeholder="Student Name"  name='name' value={formData.name || ""} onChange={handleChange} />
        <input className="modal_input" placeholder="Roll Number" name='rollNo' value={formData.rollNo || ""} onChange={handleChange}  />
        <input className="modal_input" placeholder="Stop Name" name='stopName' value={formData.stopName || ""} onChange={handleChange}  />
        <input className="modal_input" placeholder="Class / Department" name='department' value={formData.department || ""} onChange={handleChange}  />
        <input className="modal_input" placeholder="Email"  name='email' value={formData.email || ""} onChange={handleChange} />
        <input className="modal_input" placeholder="Guardian Name"  name='gaurdianName' value={formData.gaurdianName || ""} onChange={handleChange} />
        <input className="modal_input" placeholder="Guardian Phone"  name='gaurdianPhone' value={formData.gaurdianPhone || ""} onChange={handleChange} />
        <input className="modal_input" placeholder="Guardian Email"  name='gaurdianEmail' value={formData.gaurdianEmail || ""} onChange={handleChange} />

        <button onClick={handleSubmit} className="modal_button">{editData  ? "Update":'Add'}</button>
        <button onClick={onClose} className="modal_button">Cancel</button>
      </div>
    </div>
  );
};

export default AddPassengerModal;
