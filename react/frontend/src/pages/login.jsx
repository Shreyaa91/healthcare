import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import "./login1.css"; 
import logo from './logo.jpg';
const API_BASE_URL = import.meta.env.VITE_API_URL;


const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleChange = (e) => {
    setRole(e.target.value); // Update role based on selection
  };


const handleLogin = async () => {
  try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post(`${API_BASE_URL}/login`, formData, {
          headers: {
              "Content-Type": "application/x-www-form-urlencoded",
          },
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_role", response.data.role);

      // Fetch user details after login
    const userResponse = await axios.get(`${API_BASE_URL}/user/me`, {
      headers: { Authorization: `Bearer ${response.data.access_token}` },
    });

    localStorage.setItem("user", JSON.stringify(userResponse.data));

      alert("Login successful!");
      navigate("/appointment");
  } catch (err) {
    console.error("Login error:", err);
  
    const detail = err.response?.data?.detail;
  
    if (detail === "Invalid User ID") {
      setError("Invalid User ID");
    } else if (detail === "Invalid password") {
      setError("Invalid Password");
    } else {
      setError("Login failed. Please try again.");
    }
  }
};


  return (
   
<div className="login-main">
  <div className="container-login">
    <img id="logo"src={logo} alt="Logo" />
    <div className="login">
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
          {/* <label htmlFor="email">User name</label> */}
          <input
              type="text"
              id="username"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
          />
          </div>

            <div>
            {/* <label htmlFor="pass">Password</label> */}
            <input
              type="password"
              id="pass"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />        
              
            </div>
          
        <label id="r">Role</label>
        <div className="role">          
          <div id="radio1">            
            <input type="radio" id="patient" name="role" value="patient" onChange={handleChange} checked={role==="patient"}/>
            <label htmlFor="patient">Patient</label>
          </div>

          <div id="radio2">           
          <input type="radio" id="specialist" name="role" value="specialist" onChange={handleChange} checked={role === "specialist"}/>
          <label htmlFor="specialist">Specialist</label>
          </div>

        </div>
            <button id="btn" type="button" onClick={handleLogin}>Login</button>
            

            {error && <p style={{ color: "red",textAlign:"center" }}>{error}</p>}
            
        </form>
        <div className="last">
          
              {/* <a id="a"href="#">Forgot password?</a>  */}
              <Link id="a" to="/forgot_password">Forgot password?</Link>       
              <Link id="signup" to="/signup">Signup</Link>
        </div>
    </div>
  </div>
  </div>
    
  );
};

export default Login;
