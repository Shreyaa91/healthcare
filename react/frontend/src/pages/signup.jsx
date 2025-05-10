import { useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import api from "../api";
import './signup.css'

const Signup = ({ setPage }) => {
  const navigate=useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    phone:"",
    gender: "male",
    username: "",
    password: "",
    role:"patient",
    speciality:"",
    experience:""
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
      navigate("/");
    } catch (err) {
      console.error("Signup Error:", err.response ? err.response.data : err.message);
    
      // Display the actual backend error message if available
      const errorMsg = err?.response?.data?.detail || "Signup failed. Try again.";
      setError(errorMsg);
    }
    
  };
  

  return (
    <div className="container">
      <div className="signup">
      <h2>Create New Account</h2>
      {error && <p style={{ color: "red", textAlign:"center",marginRight:"20px"}}>{error}</p>}
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
        <input id="age" type="number" name="age" placeholder="Age" min="1" onChange={handleChange} required />
        </div>
        <div>
        {/* <label htmlFor="ph_no">Phone Number</label> */}
        <input
  id="ph_no"
  type="tel"
  name="phone"
  placeholder="Phone Number"
  onChange={handleChange}
  pattern="\d{10}"
  maxLength="10"
  required
/>
        </div>
        <div>
        <label>Gender</label>
        <div className="gender">
          <div id="radio3">
          <input type="radio" id="male" name="gender"  value="male" onChange={handleChange} defaultChecked/>
          <label htmlFor="male">Male</label>
          </div>

          <div id="radio4">
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
      id="speciality"
      placeholder="Enter Speciality" 
      onChange={handleChange} 
      required 
    />
       <input 
      type="number" 
      name="experience" 
      id="experience"
      placeholder="Years of Experience" 
      onChange={handleChange} 
      min="0"
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
        <button id="signup-btn" type="submit">Signup</button>
        </div>
        <p id="log">Have an account? <Link id="login" to="/">Login</Link> </p>
      </form>
      </div>
   </div>
  );
};

export default Signup;

