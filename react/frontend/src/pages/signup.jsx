import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import api from "../api";
import './signup.css'

const Signup = ({ setPage }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    phone:"",
    gender: "male",
    username: "",
    password: "",
    role:"patient",
    speciality:""
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Updates input values properly
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
  
    try {
      const response = await api.post("/signup", formData);
      alert(response.data.message); // Show the success message
      setPage("login"); // Redirect to login page
    } catch (err) {
      console.error("Signup Error:", err.response ? err.response.data : err.message);
  
      // Display the actual backend error message if available
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Signup failed. Try again.");
      }
    }
  };
  

  return (
    <div className="container">
      <div className="signup">
      <h2>Create New Account</h2>
      {error && <p style={{ color: "red", textAlign:"center"}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
      {/* <label htmlFor="name">Name</label> */}
        <input id="name" type="text" name="name" placeholder="Name" onChange={handleChange} required />
        </div>
        <div>
        {/* <label htmlFor="email">Email</label> */}
        <input id="email" type="email" name="email" placeholder="Email" onChange={handleChange} required />
        </div>
        <div>
        {/* <label htmlFor="age">Age</label> */}
        <input id="age" type="number" name="age" placeholder="Age" onChange={handleChange} required />
        </div>
        <div>
        {/* <label htmlFor="ph_no">Phone Number</label> */}
        <input id="ph_no" type="number" name="phone" placeholder="Phone Number" onChange={handleChange} required />
        </div>
        <div>
        <label>Gender</label>
        <div className="gender">
          <div id="radio1">
          <input type="radio" id="male" name="gender"  value="male" onChange={handleChange} defaultChecked/>
          <label htmlFor="male">Male</label>
          </div>

          <div id="radio2">
          <input type="radio" id="female" name="gender" value="female" onChange={handleChange}/>
          <label htmlFor="female">Female</label>
          </div>
        </div>
        {/* <select  id="gender" name="gender" onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select> */}
        </div>
        <label>Role</label>
        <div className="role">          
          <div id="radio1">            
            <input type="radio" id="patient" name="role" value="patient" onChange={handleChange} checked={formData.role === "patient"} />
            <label htmlFor="patient">Patient</label>
          </div>

          <div id="radio2">           
          <input type="radio" id="specialist" name="role" value="specialist" onChange={handleChange} checked={formData.role === "specialist"} />
          <label htmlFor="specialist">Specialist</label>
          </div>

        </div>
        {/* Show Specialty Input if Specialist is Selected */}
{formData.role === "specialist" && (
  <div>
    <input 
      type="text" 
      name="specialty" 
      placeholder="Enter Specialty" 
      onChange={handleChange} 
      required 
    />
  </div>
)}
        <div>
        {/* <label htmlFor="username">Username</label> */}
        <input id="username"type="text" name="username" placeholder="Username" onChange={handleChange} required />
        </div>
        <div>
        {/* <label htmlFor="password">Password</label> */}
        <input id="password" type="password" name="password" placeholder="Password" onChange={handleChange} required />
        </div>
        <div>
        <button type="submit">Signup</button>
        </div>
        <p id="log">Have an account? <Link id="login" to="/">Login</Link> </p>
      </form>
      </div>
   </div>
  );
};

export default Signup;

