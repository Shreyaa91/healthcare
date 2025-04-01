import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            try {
                const response = await axios.get("http://localhost:8000/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setUser(response.data);
                setRole(response.data.role);

                // Fetch appointments based on user role
                if (response.data.role === "patient") {
                    fetchAppointments(response.data.username);
                }
                if (response.data.role === "specialist") {
                    fetchDoctorAppointments(response.data.username);
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                navigate("/login");
            }
        };

        fetchUserData();
    }, []);

    const fetchAppointments = async (username) => {
        try {
            const response = await axios.get(`http://localhost:8000/appointments/${username}`);
            setAppointments(response.data);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    const fetchDoctorAppointments = async (doctorName) => {
        try {
            const response = await axios.get(`http://localhost:8000/doctor/appointments/${doctorName}`);
            setAppointments(response.data);
        } catch (error) {
            console.error("Error fetching doctor appointments:", error);
        }
    };

    const handleSearch = async () => {
        try {
            const response = await axios.get(`http://localhost:8000/doctors/search?query=${searchQuery}`);
            setDoctors(response.data);
        } catch (error) {
            console.error("Error searching doctors:", error);
        }
    };

    return (
        <div>
            <header style={{ backgroundColor: "#007bff", padding: "10px", color: "white", display: "flex", justifyContent: "space-between" }}>
                <h2>Healthcare Dashboard</h2>
                <nav>
                    <button onClick={() => navigate("/appointments")}>Appointments</button>
                    <button onClick={() => navigate("/consultation")}>Consultation</button>
                    <button onClick={() => navigate("/medical-records")}>Medical Records</button>
                    <button onClick={() => navigate("/e-pharmacy")}>E-Pharmacy</button>
                    <button onClick={() => navigate("/billings")}>Billings</button>
                    <button onClick={() => navigate("/settings")}>Settings</button>
                    <button onClick={() => navigate("/help-center")}>Help Center</button>
                </nav>
            </header>

            <main style={{ padding: "20px" }}>
                {user && <h1>Welcome, {user.username}!</h1>}

                {role === "patient" && (
                    <>
                        <h2>Your Appointments</h2>
                        <ul>
                            {appointments.slice(0, 3).map((appt) => (
                                <li key={appt.id}>
                                    {appt.date} - {appt.doctor}
                                </li>
                            ))}
                        </ul>

                        <h2>Search for Doctors</h2>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or specialty"
                        />
                        <button onClick={handleSearch}>Search</button>

                        <ul>
                            {doctors.map((doc) => (
                                <li key={doc.id}>{doc.name} - {doc.specialty}</li>
                            ))}
                        </ul>
                    </>
                )}

                {role === "specialist" && (
                    <>
                        <h2>Manage Your Schedule</h2>
                        <button onClick={() => navigate("/schedule")}>Update Schedule</button>
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
