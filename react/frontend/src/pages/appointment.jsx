import { useEffect, useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import "./appointment.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";




const AppointmentPage = ({ user }) => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState(null);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showDoctorList, setShowDoctorList] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [rescheduling, setRescheduling] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);


  
  
  // State for schedule creation
  const [scheduleInput, setScheduleInput] = useState({
    available_date: "",
    start_time: "",
    end_time: "",
    is_available: true,
  });

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Sending token:",token);
      console.log(user.id);
      const response = await fetch(`http://localhost:8000/patient/${user.id}/appointments`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) throw new Error("Failed to fetch appointments");
      
      const data = await response.json();
      setAppointments(data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
    
  };
  console.log(appointments);
  useEffect(() => {
    if (user && user.role === "patient") {
      fetchAppointments();
    }
  }, [user]);
  

  useEffect(() => {
    if (!user) {
      console.log("User not found");
      return;
    }
    console.log("User role:", user?.role);
    if (user.role === "patient") {
      fetchDoctors();
    } else if (user.role === "specialist") {
      fetchSchedule(user.id);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleInput((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const fetchAvailableSlots = async (doctorId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/doctor/${doctorId}/schedule`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
  
      if (!response.ok) throw new Error("Failed to fetch schedule");
      const data = await response.json();
      setRescheduleSlots(data.filter(slot => slot.is_available));
    } catch (error) {
      console.error("Error fetching available slots:", error);
    }
  };
  const fetchDoctors = async () => {
    try {
      const response = await fetch("http://localhost:8000/doctors");
      if (!response.ok) throw new Error("Failed to fetch doctors");
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  //FETCH EXISTING SCHEDULE
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
    finally {
      setLoading(false);
    }
};

const fetchPatientDetails = async (slotId,doctorId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:8000/${doctorId}/slot/${slotId}/patient`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to fetch patient details");
    }
    const data = await response.json();
    console.log("DATA:",data)
    setSelectedPatient(data);
  } catch (error) {
    console.error("Error fetching patient info:", error);
    setSelectedPatient(null);
  }
};



const createSchedule = async (scheduleInput) => {
  try {
    const response = await fetch(`http://localhost:8000/doctor/${user.id}/schedule`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
      body: JSON.stringify([scheduleInput]),
    });
    const data = await response.json();
    alert(data.message);
    fetchSchedule(user.id);
    setShowScheduleForm(false);
  } catch (error) {
    console.error("Error creating schedule:", error);
  }
};


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
      fetchAppointments(); 
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };

  // Handle Reschedule Click
const handleRescheduleClick = (appointment) => {
  console.log("Rescheduling appointment:", appointment);  // Debugging
  if (!appointment.doctor_id) {
    console.error("Error: Doctor ID is missing for this appointment.");
    alert("Error: Doctor information is missing.");
    return;
  }
  setRescheduling(appointment.schedule_id);
  fetchAvailableSlots(appointment.doctor_id);
};
console.log("Rescheduling:",rescheduling)


const rescheduleAppointment = async (appointmentId, newScheduleId) => {
  try {
    const token = localStorage.getItem("token");
    console.log(appointmentId,'  ',newScheduleId);
        const url = `http://localhost:8000/appointments/reschedule/${appointmentId}`;
    console.log("Request URL:", url);
    console.log("New Schedule ID:", newScheduleId);
    
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ schedule_id: newScheduleId }),
    });
    
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`Failed to reschedule appointment: ${response.status}`);
    }
    
    alert("Appointment rescheduled successfully!");
    setRescheduling(null);
    fetchAppointments(); // Refresh appointments list
  } catch (error) {
    console.error(error);
    alert("Error rescheduling appointment: " + error.message);
  }
};
  
const cancelAppointment = async (appointment) => {
  console.log(appointment);

  // Parse the appointment's scheduled date and time
  const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`); // Ensure time is considered
  const currentDate = new Date();

  // Check if the appointment is in the future
  if (appointmentDate <= currentDate) {
    alert("You can only cancel future appointments.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:8000/appointments/cancel/${appointment.id}`, {
      method: "PUT",  
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to cancel appointment");
    }

    alert("Appointment canceled successfully!");
    fetchAppointments(); // Refresh appointments list
  } catch (error) {
    console.error(error);
    alert("Error canceling appointment");
  }
};


  const updateScheduleSlot = async (slotId, updatedSlot) => {
    console.log(slotId)
    try {
     
      const response = await fetch(`http://localhost:8000/doctor/${user.id}/schedule/${slotId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSlot),
      });
      const data = await response.json();
      alert(data.message);
      setEditingSlot(null);
      fetchSchedule(user.id);
    } catch (error) {
      console.error("Error updating slot:", error);
    }
    if (error.response.status === 400) {
      alert("Cannot update a booked schedule");
    }
  };

  // const deleteScheduleSlot = async (slotId) => {
  //   try {
  //     const token=localStorage.getItem("token");
  //     console.log("Token:",token);
  //     const response = await fetch(`http://localhost:8000/doctor/${user.id}/schedule/${slotId}`, {
  //       method: "DELETE",
  //       headers: {
          
  //         "Authorization": `Bearer ${token}`,
  //         "Content-Type": "application/json",
  //       },
  //     });
  //     const data = await response.json();
  //     alert(data.message);
  //     fetchSchedule(user.id);
  //   } catch (error) {
  //     console.error("Error deleting slot:", error);
  //   }
  // };

  const deleteScheduleSlot = async (slotId) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://localhost:8000/doctor/${user.id}/schedule/${slotId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      // Check if the response is OK
      if (!response.ok) {
        // Show the specific error message from the backend
        alert(data.detail || "Failed to delete slot");
        return;
      }
      
      // Success case
      alert("Schedule slot deleted successfully");
      fetchSchedule(user.id);
    } catch (error) {
      console.error("Error deleting slot:", error);
      alert("Failed to delete schedule slot");
    }
  };


return (
  <div className="appointment-container">
    {/* Left Panel */}
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

    {/* Main Content */}
    <div className="content">
      {!user ? (
        <p className="loading-text">Loading user...</p>
      ) : user.role === "patient" ? (
        (() => {
          // const upcomingAppointments = Array.isArray(appointments)
          // ? appointments.filter((appointment) => {
          //     const appointmentDate = new Date(appointment.date);
          //     const now = new Date();
          //     return appointment.status === "upcoming" && !appointmentDate < now;
          //   })
          // : [];

          //USE THIS
  //         const upcomingAppointments = Array.isArray(appointments)
  // ? appointments.filter((appointment) => {
  //     try {
  //       const datePart = appointment.appointment_date; // e.g. "2025-05-05"
  //       let timePart = appointment.start_time; // e.g. "18:00" or "18:00:00"
        
  //       // Ensure time is in HH:mm:ss format
  //       if (/^\d{2}:\d{2}$/.test(timePart)) {
  //         timePart += ":00"; // convert "18:00" to "18:00:00"
  //       }
        
  //       // Debug the values
  //       console.log("Date part:", datePart);
  //       console.log("Time part:", timePart);
        
  //       // Make sure we're using ISO 8601 format with timezone
  //       const dateTimeString = `${datePart}T${timePart}`;
  //       console.log("DateTime string:", dateTimeString);
        
  //       // Try parsing with explicit timezone handling
  //       const appointmentDateTime = new Date(dateTimeString);
  //       const now = new Date();
        
  //       // Check if date is valid
  //       if (isNaN(appointmentDateTime.getTime())) {
  //         console.error("Invalid date format:", dateTimeString);
  //         return false;
  //       }
        
  //       console.log("NOW:", now);
  //       console.log("Appointment DATETIME:", appointmentDateTime);
        
  //       return (
  //         appointment.status === "upcoming" &&
  //         appointmentDateTime.getTime() >= now.getTime()
  //       );
  //     } catch (error) {
  //       console.error("Error parsing appointment date:", error);
  //       return false;
  //     }
  //   })
  // : [];

  const upcomingAppointments = Array.isArray(appointments)
  ? appointments.filter((appointment) => {
      try {
        const datePart = appointment.appointment_date; // e.g. "2025-05-05"
        let timePart = appointment.start_time; // e.g. "18:00" or "18:00:00"
        
        // Ensure time is in HH:mm:ss format
        if (/^\d{2}:\d{2}$/.test(timePart)) {
          timePart += ":00"; // convert "18:00" to "18:00:00"
        }
        
        // Debug the values
        console.log("Date part:", datePart);
        console.log("Time part:", timePart);
        
        // Combine date and time to form a full datetime string
        const dateTimeString = `${datePart}T${timePart}`;
        console.log("DateTime string:", dateTimeString);
        
        // Parse the combined date-time string
        const appointmentDateTime = new Date(dateTimeString);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(appointmentDateTime.getTime())) {
          console.error("Invalid date format:", dateTimeString);
          return false;
        }
        
        console.log("NOW:", now);
        console.log("Appointment DATETIME:", appointmentDateTime);
        
        // Calculate the difference in milliseconds
        const diffInMs = appointmentDateTime - now;
        
        // Calculate a 15-minute window in milliseconds (15 * 60 * 1000)
        const fifteenMinutesInMs = 15 * 60 * 1000;
        
        // Show appointments if:
        // - They are scheduled in the future
        // - Or if the current time is within the 15-minute window of their scheduled time
        return (
          appointment.status === "upcoming" &&
          appointmentDateTime.getTime() > now.getTime() &&
          (diffInMs <= fifteenMinutesInMs || diffInMs > 0)
        );
      } catch (error) {
        console.error("Error parsing appointment date:", error);
        return false;
      }
    })
  : [];

        
        
        

        

          const pastAppointments = Array.isArray(appointments)
            ? appointments.filter((appointment) => appointment.status === "completed").slice(-2)
            : []; // Get last 2 past appointments

            const isWithin30Minutes = (appointmentDate, startTime) => {
              const appointmentStart = new Date(`${appointmentDate}T${startTime}`);
              const now = new Date();
              const diffInMs = appointmentStart - now;
              return diffInMs <= 30 * 60 * 1000 && diffInMs > 0;
            };
            // const handleJoinConsultation = (appointment) => {
            //   // navigate(`/consultation?channel=${appointment.channel_name}`);
            //   navigate('/consultation')
            // };

          return (
            <>
              <div className="card">
                <h2>My Appointments</h2>

                {/* Upcoming Appointments */}
                <h3>Upcoming Appointments</h3>
                <div className="appointments-list">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="appointment-item">
                        <div className="appointment-info">
                          <p><strong>Doctor:</strong> {appointment.doctor_name}</p>
                          <p><strong>Date:</strong> {appointment.appointment_date}</p>
                          <p><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</p>
                        </div>
                        <div className="appointment-actions">
                          <button id="reschedule" onClick={() => handleRescheduleClick(appointment)}>Reschedule</button>
                          <button id="cancel" onClick={() => cancelAppointment(appointment)}>Cancel</button>
                          {isWithin30Minutes(appointment.appointment_date, appointment.start_time) && (
                  <button id="join" onClick={() => handleJoinConsultation(appointment)}>
                    Join Consultation
                  </button>
                )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p>None.</p>
                  )}
                </div>

                {/* Past Appointments */}
                <h3>Past Appointments</h3>
                <div className="appointments-list">
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((appointment) => (
                      <div key={appointment.id} className="appointment-item">
                         <p><strong>Doctor:</strong> {appointment.doctor_name}</p>
                          <p><strong>Date:</strong> {appointment.appointment_date}</p>
                          <p><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</p>
                      </div>
                    ))
                  ) : (
                    <p>None</p>
                  )}
                </div>
              </div>

              {/* Create New Appointment Button */}
              

              {/* Rescheduling Popup */}
              {rescheduling && (
  <div className="reschedule-drawer">
    <div className="drawer-header">
      <h2>Reschedule Appointment</h2>
      <button className="close-btn" onClick={() => setRescheduling(null)}>X</button>
    </div>


    <div className="drawer-body">
      {rescheduleSlots.length > 0 ? (
        rescheduleSlots.map((slot) => (
          <div key={slot.id} className="slot-card">
            <p><strong>Date:</strong> {slot.available_date}</p>
            <p><strong>Time:</strong> {slot.start_time} - {slot.end_time}</p>
            <button className="confirm-btn" onClick={() => rescheduleAppointment(rescheduling, slot.id)}>
              Confirm
            </button>
          </div>
        ))
      ) : (
        <p>No slots available.</p>
      )}
    </div>
  </div>
)}


<div className="create-appointment-container">
                <button className="create-button" onClick={() => navigate("/bookappointment")}>
                  {showDoctorList ? "Back" : "Book an Appointment"}
                </button>
              </div>
              {/* Show Doctor List if Creating Appointment */}
              {showDoctorList && (
                <div className="doctors-list">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className="doctor-card"
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        fetchSchedule(doctor.id);
                      }}
                    >
                      <h3>{doctor.name}</h3>
                      <p>Specialization: {doctor.specialization}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Show Doctor's Available Slots if Selected */}
              {selectedDoctor && (
                <div className="doctor-details">
                  <h3>Dr. {selectedDoctor.name}</h3>
                  <p>Specialization: {selectedDoctor.specialization}</p>
                  <p>Experience: {selectedDoctor.experience} years</p>

                  <h3>Available Slots</h3>
                  <div className="slots-container">
                    {schedule.filter(s => s.is_available).map((slot, index) => (
                      <div key={index} className="slot-item">
                        <span className="slot-time">
                          {slot.available_date} - {slot.start_time} to {slot.end_time}
                        </span>
                        <button id="booknow" onClick={() => bookAppointment(slot)} className="book-button">
                          Book Now
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()
      ) : (
        <div className="schedule-container">
          {/* Left Side: Schedule */}
          <div className="schedule-list">
            <div className="card">
              <h2>My Schedule</h2>
              {schedule.length === 0 ? (
                <p>No schedule found</p>
              ) : (
                schedule.map((slot) => (
                  <div
                    key={slot.id}
                    className="schedule-item"
                    onClick={() => {
                      console.log("Slot clicked:", slot);
                      setSelectedSlot(slot);
                      if (!slot.is_available && slot.doctor_id) {
                        fetchPatientDetails(slot.id, slot.doctor_id);
                      } else {
                        setSelectedPatient(null);
                      }
                    }}
                  >
                    {editingSlot?.id === slot.id ? (
                      <>
                        <input
                          type="date"
                          name="available_date"
                          value={editingSlot.available_date}
                          onChange={(e) =>
                            setEditingSlot({
                              ...editingSlot,
                              available_date: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="time"
                          name="start_time"
                          value={editingSlot.start_time}
                          onChange={(e) =>
                            setEditingSlot({
                              ...editingSlot,
                              start_time: e.target.value,
                            })
                          }
                          required
                        />
                        <input
                          type="time"
                          name="end_time"
                          value={editingSlot.end_time}
                          onChange={(e) =>
                            setEditingSlot({
                              ...editingSlot,
                              end_time: e.target.value,
                            })
                          }
                          required
                        />
                        <button onClick={() => updateScheduleSlot(slot.id, editingSlot)}>
                          Save
                        </button>
                        <button onClick={() => setEditingSlot(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <>{slot.available_date} - {slot.start_time} to {slot.end_time} </>(
                        {slot.is_available ? "Available" : "Booked"})
                        <button onClick={() => setEditingSlot(slot)}>
                          Update
                        </button>
                        <button onClick={() => deleteScheduleSlot(slot.id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}

              <div className="create-button-div">
                <button
                  onClick={() => setShowScheduleForm((prev) => !prev)}
                  className="create-button"
                >
                  Create Schedule
                </button>
              </div>

              {showScheduleForm && (
                <div className="schedule-form">
                  { <label htmlFor="available_date">Date</label>
                  /*<input
                    id="available_date"
                    type="date"
                    name="available_date"
                    value={scheduleInput.available_date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    required
                  /> */}
                  <br/>

<DatePicker
  selected={scheduleInput.available_date ? new Date(scheduleInput.available_date) : null}
  onChange={(date) => handleInputChange({ target: { name: "available_date", value: date.toISOString().split('T')[0] } })}
  minDate={new Date()}  // only today and future dates
  dateFormat="yyyy-MM-dd"
  className="datepicker"
  placeholderText="Select a date"
/>
<br/>
                  <label htmlFor="start_time">Start Time</label>
                  <input
                    id="start_time"
                    type="time"
                    name="start_time"
                    value={scheduleInput.start_time}
                    onChange={handleInputChange}
                    required
                  />
                  <label htmlFor="end_time">End Time</label>
                  <input
                    id="end_time"
                    type="time"
                    name="end_time"
                    value={scheduleInput.end_time}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="submit-button-div">
                    <button onClick={() => createSchedule(scheduleInput)}>
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Patient Details */}
          <div className="patient-details">
            {selectedSlot ? (
              selectedSlot.is_available ? (
                <p>No booking</p>
              ) : selectedPatient ? (
                <>
                  <h3>Details</h3>
                  <p className="a"><strong>Name: </strong> {selectedPatient.name}</p>
                  <p className="a"><strong>Age: </strong> {selectedPatient.age}</p>
                  <p className="a"><strong>Email: </strong> {selectedPatient.email}</p>
                  <p className="a"><strong>Gender: </strong> {selectedPatient.gender}</p>
                  <p className="a"><strong>Date: </strong> {selectedSlot.available_date}</p>
                  <p className="a"><strong>Time: </strong> {selectedSlot.start_time} - {selectedSlot.end_time}</p>
                </>
              ) : (
                <p>Loading patient details...</p>
              )
            ) : (
              <p>Select a slot to view details</p>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);

}

export default AppointmentPage;
















//WORKING 
  
//   return (
//     <div className="appointment-container">
//         {/* Left Panel */}
//       <div className="sidebar">
        
//         <ul>
//           <li className="active">Appointments</li>
//           <li>Consultation</li>
//           <li>Medical Records</li>
//           <li>E-Pharmacy</li>
//           <li>Billing</li>
//           <li>Settings</li>
//         </ul>
//       </div>


//     <div className="content">
//       {!user ? (
//         <p className="loading-text">Loading user...</p>
//       ) : user.role === "patient" ? (
//         <div className="card">
//           <h2>Select a Doctor</h2>
          
//           {/* Displaying doctors as cards instead of a dropdown */}
//           <div className="doctors-list">
//             {doctors.map((doctor) => (
//               <div
//                 key={doctor.id}
//                 className="doctor-card"
//                 onClick={() => {
//                   setSelectedDoctor(doctor);
//                   fetchSchedule(doctor.id);
//                 }}
//               >
//                 <h3>{doctor.name}</h3>
//                 <p>Specialization: {doctor.specialization}</p>
//               </div>
//             ))}
//           </div>

//           {selectedDoctor && (
//             <div className="doctor-details">
//               <h3>Dr. {selectedDoctor.name}</h3>
//               <p>Specialization: {selectedDoctor.specialization}</p>
//               <p>Experience: {selectedDoctor.experience} years</p>
              
//               <h3>Available Slots</h3>
//               <div className="slots-container">
//                 {schedule.filter(s => s.is_available).map((slot, index) => (
//                   <button key={index} onClick={() => bookAppointment(slot)} className="slot-button">
//                     {slot.available_date} - {slot.start_time} to {slot.end_time}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       ) : (
//         <div className="card">
//           <h2>My Schedule</h2>
//           {schedule.length === 0 ? (
//             <p>No schedule found</p>
//           ) : (
//             schedule.map((slot) => (
//               <div key={slot.id} className="schedule-item" onClick={() => setSelectedSlot(slot)}>
//                 {editingSlot?.id === slot.id ? (
//                   <>
//                     <input type="date" name="available_date" value={editingSlot.available_date} onChange={(e) => setEditingSlot({ ...editingSlot, available_date: e.target.value })} required />
//                     <input type="time" name="start_time" value={editingSlot.start_time} onChange={(e) => setEditingSlot({ ...editingSlot, start_time: e.target.value })} required />
//                     <input type="time" name="end_time" value={editingSlot.end_time} onChange={(e) => setEditingSlot({ ...editingSlot, end_time: e.target.value })} required />
//                     <button onClick={() => updateScheduleSlot(slot.id,editingSlot)}>Save</button>
//                     <button onClick={() => setEditingSlot(null)}>Cancel</button>
//                   </>
//                 ) : (
//                   <>
//                     {slot.available_date} - {slot.start_time} to {slot.end_time} ({slot.is_available ? "Available" : "Booked"})
//                     <button onClick={() => setEditingSlot(slot)}>Update</button>
//                     <button onClick={() => deleteScheduleSlot(slot.id)}>Delete</button>
//                   </>
//                 )}
//               </div>
//             ))
//           )}
        
//         <div className="create-button-div">
//             <button onClick={() => setShowScheduleForm(true)} className="create-button">
//             Create Schedule
//           </button>
//         </div>
//                 {showScheduleForm && (
//             <div className="schedule-form">
//               {/* <h3>Create Schedule</h3> */}
//               <input type="date" name="available_date" value={scheduleInput.available_date} onChange={handleInputChange} required />
//               <input type="time" name="start_time" value={scheduleInput.start_time} onChange={handleInputChange} required />
//               <input type="time" name="end_time" value={scheduleInput.end_time} onChange={handleInputChange} required />
//               <div className="submit-button-div"><button onClick={()=>createSchedule(scheduleInput)}>Submit</button></div>
//             </div>
//           )}
               
//         </div>
        
//       )}
//     </div>
//   </div>
//   );
// };



// return (
//   <div className="appointment-container">
//     {/* Left Panel */}
//     <div className="sidebar">
//       <ul>
//         <li className="active">Appointments</li>
//         <li>Consultation</li>
//         <li>Medical Records</li>
//         <li>E-Pharmacy</li>
//         <li>Billing</li>
//         <li>Settings</li>
//       </ul>
//     </div>

//     {/* Main Content */}
//     <div className="content">
//       {!user ? (
//         <p className="loading-text">Loading user...</p>
//       ) : user.role === "patient" ? (
//         (() => {
//           const upcomingAppointments = Array.isArray(appointments)?appointments.filter(
//             (appointment) => appointment.status === "upcoming"
//           ):[];
      
//           const pastAppointments = Array.isArray(appointments)?appointments
//             .filter((appointment) => appointment.status === "completed")
//             .slice(-2):[]; // Get last 2 past appointments
//         return(
//         <div className="card">
//           <h2>My Appointments</h2>
          
//           {/* Upcoming Appointments */}
//           <h3>Upcoming Appointments</h3>
//           <div className="appointments-list">
//             {upcomingAppointments.length > 0 ? (
//               upcomingAppointments.map((appointment) => (
//                 <div key={appointment.id} className="appointment-item">
//                   <div className="appointment-info">
//                   <p><strong>Doctor:</strong> {appointment.doctor_name}</p>
//                   <p><strong>Date:</strong> {appointment.appointment_date}</p>
//                   <p><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</p>
//                   </div>
//                   <div className="appointment-actions">

//                   <button id="reschedule" onClick={() => handleRescheduleClick(appointment)}>Reschedule</button>
//                   <button id="cancel" onClick={() => cancelAppointment(appointment.schedule_id)}>Cancel</button>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p>None.</p>
//             )}
//           </div>
          
//           {/* Past Appointments */}
//           <h3>Past Appointments</h3>
//           <div className="appointments-list">
//             {pastAppointments.length>0 ? (
//               pastAppointments.slice(-2).map((appointment) => (
//               <div key={appointment.id} className="appointment-item">
//                 <p><strong>Doctor:</strong> {appointment.doctor.name}</p>
//                 <p><strong>Date:</strong> {appointment.date}</p>
//                 <p><strong>Time:</strong> {appointment.start_time} - {appointment.end_time}</p>
//               </div>
            
//           ))
//         ):(
//             <p>None</p>
//           )}
//           </div>

//           {/* Create New Appointment Button */}
//           {/* <button className="create-button" onClick={() => setShowDoctorList(!showDoctorList)}> */}
//           <button className="create-button" onClick={() =>navigate("/bookappointment")}>
//             {showDoctorList ? "Back" : "Create New Appointment"}
//           </button>

//           {rescheduling && (
//       <div className="reschedule-popup">
//         <h4>Select a new time slot</h4>
//         <ul>
//           {rescheduleSlots.length > 0 ? (
//             rescheduleSlots.map((slot) =>{
//               console.log("Slot details:", slot); 
            
//               return (
//               <li key={slot.id}>
//                 <button onClick={() => rescheduleAppointment(rescheduling, slot.id)}>
//                   {slot.available_date} {slot.start_time} - {slot.end_time}
//                 </button>
//               </li>
//               );
//         })
//           ) : (
//             <p>No available slots.</p>
//           )}
//         </ul>
//         <button onClick={() => setRescheduling(null)}>Cancel</button>
//       </div>
//     )}
          
//           {/* Show Doctor List if Creating Appointment */}
//           {showDoctorList && (
//             <div className="doctors-list">
//               {doctors.map((doctor) => (
//                 <div
//                   key={doctor.id}
//                   className="doctor-card"
//                   onClick={() => {
//                     setSelectedDoctor(doctor);
//                     fetchSchedule(doctor.id);
//                   }}
//                 >
//                   <h3>{doctor.name}</h3>
//                   <p>Specialization: {doctor.specialization}</p>
//                 </div>
//               ))}
//             </div>
//           )}
          
//           {/* Show Doctor's Available Slots if Selected */}
//           {selectedDoctor && (
//             <div className="doctor-details">
//               <h3>Dr. {selectedDoctor.name}</h3>
//               <p>Specialization: {selectedDoctor.specialization}</p>
//               <p>Experience: {selectedDoctor.experience} years</p>
              
//               <h3>Available Slots</h3>
//               <div className="slots-container">
//               {schedule.filter(s => s.is_available).map((slot, index) => (
//               <div key={index} className="slot-item">
//                 <span className="slot-time">
//                   {slot.available_date} - {slot.start_time} to {slot.end_time}
//                 </span>
//                 <button id="booknow" onClick={() => bookAppointment(slot)} className="book-button">
//                   Book Now
//                 </button>
//               </div>
//             ))}
//               </div>
//             </div>
//           )}
//         </div>
//         );
//       })()
//       ) : (
//         <div className="schedule-container">
//           {/* Left Side: Schedule */}
//           <div className="schedule-list">
//             <div className="card">
//               <h2>My Schedule</h2>
//               {schedule.length === 0 ? (
//                 <p>No schedule found</p>
//               ) : (
//                 schedule.map((slot) => (
                  
//                   <div
//                     key={slot.id}
//                     className="schedule-item"
//                     onClick={() => {
//                       console.log("Slot clicked:", slot);
//                       setSelectedSlot(slot);
//                       if (!slot.is_available && slot.doctor_id) {
//                         fetchPatientDetails(slot.id, slot.doctor_id);
//                       } else {
//                         setSelectedPatient(null);
//                       }
//                     }}
//                   >
//                     {editingSlot?.id === slot.id ? (
//                       <>
//                         <input
//                           type="date"
//                           name="available_date"
//                           value={editingSlot.available_date}
//                           onChange={(e) =>
//                             setEditingSlot({
//                               ...editingSlot,
//                               available_date: e.target.value,
//                             })
//                           }
//                           required
//                         />
//                         <input
//                           type="time"
//                           name="start_time"
//                           value={editingSlot.start_time}
//                           onChange={(e) =>
//                             setEditingSlot({
//                               ...editingSlot,
//                               start_time: e.target.value,
//                             })
//                           }
//                           required
//                         />
//                         <input
//                           type="time"
//                           name="end_time"
//                           value={editingSlot.end_time}
//                           onChange={(e) =>
//                             setEditingSlot({
//                               ...editingSlot,
//                               end_time: e.target.value,
//                             })
//                           }
//                           required
//                         />
//                         <button
//                           onClick={() =>
//                             updateScheduleSlot(slot.id, editingSlot)
//                           }
//                         >
//                           Save
//                         </button>
//                         <button onClick={() => setEditingSlot(null)}>
//                           Cancel
//                         </button>
//                       </>
//                     ) : (
//                       <>
//                         {slot.available_date} - {slot.start_time} to{" "}
//                         {slot.end_time} (
//                         {slot.is_available ? "Available" : "Booked"})
//                         <button onClick={() => setEditingSlot(slot)}>
//                           Update
//                         </button>
//                         <button onClick={() => deleteScheduleSlot(slot.id)}>
//                           Delete
//                         </button>
//                       </>
//                     )}
//                   </div>
//                 ))
//               )}

//               <div className="create-button-div">
//                 <button
//                   onClick={() => setShowScheduleForm((prev) => !prev)}
//                   className="create-button"
//                 >
//                   Create Schedule
//                 </button>
//               </div>

//               {showScheduleForm && (
//                 <div className="schedule-form">
//                   <label htmlFor="available_date">Date</label>
//                   <input
//                    id="available_date"
//                     type="date"
//                     name="available_date"
//                     value={scheduleInput.available_date}
//                     onChange={handleInputChange}
//                     required
//                   />
//                    <label htmlFor="start_time">Start Time</label>
//                   <input
//                     type="time"
//                     id="start_time"
//                     name="start_time"
//                     value={scheduleInput.start_time}
//                     onChange={handleInputChange}
//                     required
//                   />

//                   <label htmlFor="end_time">End Time</label>
//                   <input
//                     type="time"
//                      id="end_time"
//                     name="end_time"
//                     value={scheduleInput.end_time}
//                     onChange={handleInputChange}
//                     required
//                   />
//                   <div className="submit-button-div">
//                     <button onClick={() => createSchedule(scheduleInput)}>
//                       Submit
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
              
//           {/* Right Side: Patient Details */}
//           <div className="patient-details">
//             {selectedSlot ? (
//               selectedSlot.is_available ? (
//                 <p>No booking</p>
//               ) : selectedPatient ?(
//                 <>
//                   <h3>Details</h3>
//                   <p className='a'>
//                     <strong>Name:</strong> {selectedPatient.name}
//                   </p>
//                   <p className='a'>
//                     <strong>Age:</strong> {selectedPatient.age}
//                   </p>
//                   <p className='a'>
//                     <strong>Email:</strong> {selectedPatient.email}
//                   </p>
//                   <p className='a'>
//                     <strong>Gender:</strong> {selectedPatient.gender}
//                   </p>
//                   <p className='a'>
//                     <strong>Date:</strong> {selectedSlot.available_date}
//                   </p>
//                   <p className='a'>
//                     <strong>Time:</strong> {selectedSlot.start_time} - {selectedSlot.end_time}
//                   </p>
//                 </>
//               ):(<p>Loading patient details...</p>)
//             ) : (
//               <p>Select a slot to view details</p>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   </div>
// );

