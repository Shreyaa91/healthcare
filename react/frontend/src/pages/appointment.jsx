import { useEffect, useState } from "react";
import { Link,useNavigate } from "react-router-dom";
import "./appointment.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import profilelogo from "./image.png";
const API_BASE_URL = import.meta.env.VITE_API_URL;


const AppointmentPage = ({ user }) => {
  const token=localStorage.getItem("token");
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


  
  const formatTime = (timeString) => {
  const [hour, minute] = timeString.split(':');
  const date = new Date();
  date.setHours(hour, minute);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

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
      const response = await fetch(`${API_BASE_URL}/patient/${user.id}/appointments`, {
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
      const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}/schedule`, {
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
      const response = await fetch(`${API_BASE_URL}/doctors`);
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
      const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}/schedule`, {
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
    const response = await fetch(`${API_BASE_URL}/${doctorId}/slot/${slotId}/patient`, {
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



// const createSchedule = async (scheduleInput) => {
//     const now = new Date();
//   const selectedDate = new Date(scheduleInput.available_date);
//   const startTime = new Date(`${scheduleInput.available_date}T${scheduleInput.start_time}`);

//   // Check if the selected start time is in the past
//   if (startTime <= now) {
//     alert("Schedule time must be greater than the current time");
//     return;
//   }
//   try {
//     const response = await fetch(`${API_BASE_URL}/doctor/${user.id}/schedule`, {
//       method: "POST",
//       headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
//       body: JSON.stringify([scheduleInput]),
//     });
//     const data = await response.json();
//     alert(data.message);
//     fetchSchedule(user.id);
//     setShowScheduleForm(false);
//   } catch (error) {
//     console.error("Error creating schedule:", error);
//   }
// };

const createSchedule = async (scheduleInput) => {
  const now = new Date();
  const startTime = new Date(`${scheduleInput.available_date}T${scheduleInput.start_time}`);
  const endTime = new Date(`${scheduleInput.available_date}T${scheduleInput.end_time}`);

  // Check: Start time must be in future
  if (startTime <= now) {
    alert("Start time must be greater than the current time");
    return;
  }

  // Check: End time must be after start time
  if (endTime <= startTime) {
    alert("End time must be greater than start time");
    return;
  }

  // Check: No overlapping schedules
  const overlapping = schedule.some((slot) => {
    const slotStart = new Date(`${slot.available_date}T${slot.start_time}`);
    const slotEnd = new Date(`${slot.available_date}T${slot.end_time}`);

    return (
      slot.available_date === scheduleInput.available_date &&
      (
        (startTime >= slotStart && startTime < slotEnd) || // start inside another slot
        (endTime > slotStart && endTime <= slotEnd) ||     // end inside another slot
        (startTime <= slotStart && endTime >= slotEnd)     // completely overlaps another slot
      )
    );
  });

  if (overlapping) {
    alert("This slot overlaps with an existing one.");
    return;
  }

  // Create schedule if all checks pass
  try {
    const response = await fetch(`${API_BASE_URL}/doctor/${user.id}/schedule`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      },
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
      const response = await fetch(`${API_BASE_URL}/book_appointment`, {
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
        const url = `${API_BASE_URL}/appointments/reschedule/${appointmentId}`;
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
    const response = await fetch(`${API_BASE_URL}/appointments/cancel/${appointment.id}`, {
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
  try {
    const slotDateTime = new Date(`${updatedSlot.available_date}T${updatedSlot.start_time}`);
    const now = new Date();

    if (slotDateTime <= now) {
      alert("Appointment time must be in the future.");
      return; // prevent update
    }

    const response = await fetch(`${API_BASE_URL}/doctor/${user.id}/schedule/${slotId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedSlot),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 400) {
        alert(errorData.message || "Cannot update a booked schedule");
      } else {
        alert("Failed to update schedule slot");
      }
      return;
    }

    const data = await response.json();
    alert(data.message);
    setEditingSlot(null);
    fetchSchedule(user.id);
  } catch (error) {
    console.error("Error updating slot:", error);
    alert("An unexpected error occurred while updating the slot");
  }
};


  const deleteScheduleSlot = async (slotId) => {
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_BASE_URL}/doctor/${user.id}/schedule/${slotId}`, {
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
        {/* <li onClick={()=>navigate('/consultation')}>Consultation</li> */}
        <li onClick={()=>navigate('/medicalrecords')}>Medical Records</li>
        <li onClick={()=>navigate('/medicineordering')}>E-Pharmacy</li>
        <li onClick={()=>navigate('/payment')}>Billing</li>
        {/* <li onClick={()=>navigate('/appointment')}>Settings</li> */}
        <li onClick={() => navigate('/feedback')}>Feedback</li>
      </ul>
         <div className="image" onClick={()=>navigate('/profile')}>
             <img id="profile-icon" src={profilelogo}></img>
             <p id="profile-username">{user?.username}</p>
            </div>
    </div>

    {/* Main Content */}
    <div className="content">
      {!user ? (
        <p className="loading-text">Loading user...</p>
      ) : user.role === "patient" ? (
        (() => {

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
        // console.log("Date part:", datePart);
        // console.log("Time part:", timePart);
        
        // Combine date and time to form a full datetime string
        const dateTimeString = `${datePart}T${timePart}`;
        // console.log("DateTime string:", dateTimeString);
        
        // Parse the combined date-time string
        const appointmentDateTime = new Date(dateTimeString);
        const now = new Date();
        
        // Check if date is valid
        if (isNaN(appointmentDateTime.getTime())) {
          console.error("Invalid date format:", dateTimeString);
          return false;
        }
        
        // console.log("NOW:", now);
        // console.log("Appointment DATETIME:", appointmentDateTime);
        
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
                          <p><strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                        </div>
                        <div className="appointment-actions">
                          <button id="reschedule" onClick={() => handleRescheduleClick(appointment)}>Reschedule</button>
                          <button id="cancel" onClick={() => cancelAppointment(appointment)}>Cancel</button>
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
                          <p><strong>Time:</strong> {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                      </div>
                    ))
                  ) : (
                    <p>None</p>
                  )}
                </div>
              </div>

                         

              {/* Rescheduling Popup */}
              {rescheduling && (
  <div className="reschedule-drawer">
    <div className="drawer-header">
      <h2>Reschedule Appointment</h2>
      <button className="close-btn" onClick={() => setRescheduling(null)}>X</button>
    </div>


    <div className="drawer-body">
      {rescheduleSlots.filter((slot) => {
        const startDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
        return startDateTime > new Date();
      }).length > 0 ? (
        rescheduleSlots.filter((slot) => {
            const startDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
            return startDateTime > new Date();
          }).map((slot) => (
          <div key={slot.id} className="slot-card">
            <p><strong>Date:</strong> {slot.available_date}</p>
            <p><strong>Time:</strong> {formatTime(slot.start_time)} - {formatTime(slot.end_time)}</p>
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
                          {slot.available_date} - {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
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
  <>
    {/* Booked Appointments Section */}
    <h3>Booked Appointments</h3>
    {schedule.filter((slot) =>{
      const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
      return !slot.is_available && slotDateTime > new Date();
    }).length === 0 ? (
      <p>No booked appointments</p>
    ) : (
      schedule
        .filter((slot) => {
          const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
          return !slot.is_available && slotDateTime > new Date();
        })
        .map((slot) => (
          <div
            key={slot.id}
            className="schedule-item"
            onClick={() => {
              setSelectedSlot(slot);
              if (slot.doctor_id) {
                fetchPatientDetails(slot.id, slot.doctor_id);
              }
            }}
          >
            <p id="schedule-details">
              {slot.available_date} - {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
            </p>
          </div>
        ))
    )}

    {/* Available Slots Section */}
    <h3>Available Slots</h3>
    {schedule.filter((slot) => {
      const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
      return slot.is_available && slotDateTime > new Date();
    }).length === 0 ? (
      <p>No available slots</p>
    ) : (
      schedule
        .filter((slot) =>{
          const slotDateTime = new Date(`${slot.available_date}T${slot.start_time}`);
          return slot.is_available && slotDateTime > new Date();
        })
        .map((slot) => (
          <div
            key={slot.id}
            className="schedule-item"
            onClick={() => {
              setSelectedSlot(slot);
              setSelectedPatient(null);
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
                <button onClick={() => setEditingSlot(null)}>Cancel</button>
              </>
            ) : (
              <>
                <p id="schedule-details">
                  {slot.available_date} - {formatTime(slot.start_time)} to {formatTime(slot.end_time)}
                </p>
                <button onClick={() => setEditingSlot(slot)}>Update</button>
                <button onClick={() => deleteScheduleSlot(slot.id)}>Delete</button>
              </>
            )}
          </div>
        ))
    )}
  </>
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
                  { <label  className="label-create-schedule" htmlFor="available_date">Date</label>
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
                  <label  className="label-create-schedule" htmlFor="start_time">Start Time</label>
                  <input
                    id="start_time"
                    type="time"
                    name="start_time"
                    value={scheduleInput.start_time}
                    onChange={handleInputChange}
                    required
                  />
                  <label  className="label-create-schedule" htmlFor="end_time">End Time</label>
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
                  <p className="a"><strong>Time: </strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
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














