import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./book_appointment.css"

const BookAppointment = ({user}) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch all doctors
  const fetchDoctors = async () => {
    try {
      const response = await axios.get("http://localhost:8000/doctors", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Make sure data is an array
      if (Array.isArray(response.data)) {
        setDoctors(response.data);
      } else {
        console.error("Invalid doctors data format:", response.data);
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  // Fetch schedule of selected doctor
  const fetchSchedule = async (doctorId) => {
    if (!doctorId) 
      {
        console.log("Doctor id not found")
        return;
      }
    try {
      
      const token = localStorage.getItem("token"); // Retrieve token from local storage
      console.log(token)
      const response = await fetch(`http://localhost:8000/doctor/${doctorId}/schedule`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,  // Send token for authentication
          "Content-Type": "application/json"
        }
      });


      if (!response.ok) throw new Error("Failed to fetch schedule");

      const data = await response.json();
      if (data.length === 0) {
        console.log("No schedule found");
        setSchedule([]);
      }
        
      setSchedule(data);
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
   
};

  // Book the appointment
  const bookAppointment = async (slot) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/book_appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          patient_id: user.id,
          available_date: slot.available_date,
          start_time: slot.start_time,
        }),
      });
      const data = await response.json();
      alert(data.message);
      fetchSchedule(selectedDoctor.id);
      
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };



  useEffect(() => {
    fetchDoctors();
  }, []);

  return (
    <div className="appointment-container">
      <div className="sidebar">
        <ul>
        <li onClick={()=>navigate('/appointment')}className="active">Appointments</li>
        <li onClick={()=>navigate('/consultation')}>Consultation</li>
        <li onClick={()=>navigate('/medicalrecords')}>Medical Records</li>
        <li onClick={()=>navigate('/medicineordering')}>E-Pharmacy</li>
        <li onClick={()=>navigate('/payment')}>Billing</li>
        <li onClick={()=>navigate('/appointment')}>Settings</li>
        </ul>
      </div>
  
      <div className="appointment-page">

        <div className="left-column">
        <h2>Book Appointment</h2> 
        <div className="filters">
        <input
         
          type="text"
          placeholder="Search by doctor name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />
      
        <select
          value={specializationFilter}
          onChange={(e) => setSpecializationFilter(e.target.value)}
          className="specialization-filter"
        >
          <option value="">All Specializations</option>
          {/* You can dynamically generate options based on doctors */}
          {[...new Set(doctors.map(doc => doc.specialization))].map((spec, index) => (
            <option key={index} value={spec}>{spec}</option>
          ))}
        </select>
        </div>

        <div className="appointment-content">
         
        
          {/* Doctor List (always visible) */}
          <div className="doctors-list">
            {doctors.length > 0 ? (
              doctors.filter((doctor) =>
                doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (specializationFilter ? doctor.specialization === specializationFilter : true)
              ).map((doctor) => (
                <div
                  key={doctor.id}
                  className={`doctor-card ${selectedDoctor?.id === doctor.id ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    fetchSchedule(doctor.id);
                  }}
                >
                  <h3>{doctor.name}</h3>
                  <p>Specialization: {doctor.specialization}</p>
                </div>
              ))
            ) : (
              <p>No doctors available.</p>
            )}
          </div>
        </div>
        </div>
    
  
          {/* Doctor Details + Slots (only if selected) */}
          
          {selectedDoctor && (
            <div className="doctor-details">
              <h3 id="name">Dr. {selectedDoctor.name}</h3>
              <p>Specialization: {selectedDoctor.specialization}</p>
              <p>Experience: {selectedDoctor.experience} years</p>
              
              <h3 id="slots">Available Slots</h3>
              <div className="slots-container">
              {schedule.filter(s => s.is_available).map((slot, index) => (
              <div key={index} className="slot-item">
                <span className="slot-time">
                  <h5>Date:</h5>{slot.available_date} 
                  <br/>
                  <h5>Time:</h5>{slot.start_time} to {slot.end_time}
                </span>
                <button id="booknow" onClick={() => bookAppointment(slot)} className="book-button">
                  Book Now
                </button>
              </div>
            ))}
              </div>
            </div>
          )}
          </div>
        </div>
      
    
  );
  
};

export default BookAppointment;
