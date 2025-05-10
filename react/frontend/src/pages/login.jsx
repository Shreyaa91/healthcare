import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import "./login1.css"; 
import logo from './logo.jpg';
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleChange = (e) => {
    setRole(e.target.value); // Update role based on selection
  };
//   const handleLogin = async () => {
//     try {
//       const response = await axios.post("http://localhost:8000/login", {
//         username: username, // FastAPI expects 'username'
//         password,
//       });

//       // Save JWT token in localStorage
//       localStorage.setItem("token", response.data.access_token);
//       alert("Login successful!");

//       // Check if the token is set before navigating
//       if (response.data.access_token) {
//         console.log("Navigating to consultation...");
//         navigate("/consultation");  // Redirect user
//     } else {
//         console.log("No token received, not navigating.");
//     }
// } catch (err) {
//     setError("Invalid email or password");
//     console.error("Login error:", err);
// }
// };


const handleLogin = async () => {
  try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await axios.post("http://localhost:8000/login", formData, {
          headers: {
              "Content-Type": "application/x-www-form-urlencoded",
          },
      });

      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_role", response.data.role);

      // Fetch user details after login
    const userResponse = await axios.get("http://localhost:8000/user/me", {
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
    
  );
};

export default Login;
