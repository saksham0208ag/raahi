// import { useState } from "react";
// import "./Login.css";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function Login({ onLogin }) {
//   const navigate = useNavigate();

//   const [role, setRole] = useState("organisation");
//   const [userId, setUserId] = useState("");

//   const handleLogin = async () => {
//     try {
//       const res = await axios.post(
//         "/api/auth/login",
//         { role, userId }
//       );

//       onLogin(res.data);
//       navigate("/BusTracking");

//     } catch (error) {
//       console.error(error);
//       alert("Login Failed");
//     }
//   };

//   return (
//     <div className="login">
//       <div className="login_card">
//         <h2 className="login_title">Raahi - Bus Tracking Login</h2>

//         <label className="login_label">User Type</label><br />
//         <select
//           value={role}
//           onChange={(e) => setRole(e.target.value)}
//           className="Login_select"
//         >
//           <option value="organisation">Organisation / College</option>
//           <option value="regular">Regular</option>
//         </select><br /><br />

//         <input
//           type="text"
//           placeholder="User Id / Email"
//           value={userId}
//           onChange={(e) => setUserId(e.target.value)}
//         /><br /><br />

//         <button onClick={handleLogin} className="Login_button">
//           Login
//         </button>
//       </div>
//     </div>
//   );
// }

// export default Login;

import { useState } from "react";
import "./Login.css";
import axios from "axios";

function Login({ onLogin }) {
  const [role, setRole] = useState("organisation");
  const [userId, setUserId] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "/api/auth/login",
        { role, userId }
      );

      onLogin(res.data);   
    } catch (error) {
      alert("Login Failed");
      console.error(error);
    }
  };

  return (
    <div className="login">
      <div className="login_card">
        <h2 className="login_title">Raahi - Bus Tracking Login</h2>

        <label className="login_label">User Type :</label><br />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="login_select">
          <option value="organisation">Organisation</option>
          <option value="regular">Regular</option>
        </select><br /><br />

        <input className="login_input"
          type="text"
          placeholder="User Id / Email"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        /><br /><br />

        <button onClick={handleLogin} className="login_button">Login</button>
      </div>
    </div>
  );
}

export default Login;

