import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css"; // Ensure this CSS file matches your given styles

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:8000/login", {
        username: email, // FastAPI expects 'username'
        password,
      });

      // Save JWT token in localStorage
      localStorage.setItem("token", response.data.access_token);
      alert("Login successful!");

      // Redirect 
      navigate("/consultation");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div>
      <div className="logo">
        <img src="./logo.png" alt="logo" className="logo-icon" />
        <h2 className="logo-text">Healthcare</h2>
      </div>

      <div className="container-login">
        <div className="left-bar-login">
          <h1>Login</h1>
          <p>
            Are you a specialist?
            <a id="specialist-login" href="#login/specialist">
              Login here
            </a>
          </p>
        </div>

        <div className="login">
          <form onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="email">User name</label>
            <input
              type="email"
              id="email"
              placeholder="abc@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="pass">Password</label>
            <input
              type="password"
              id="pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <h4 id="fp">
              <a href="#">Forgot password?</a>
            </h4>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <input type="button" value="Login" id="btn" onClick={handleLogin} />
          </form>
          <p id="last">
                Already logged in? <Link id="signup" to="/signup">Signup</Link> here
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
