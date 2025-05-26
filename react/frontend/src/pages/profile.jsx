import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import './profile.css'
import profilelogo from "./image.png";
const API_BASE_URL = import.meta.env.VITE_API_URL;


const ProfilePage = ({user}) => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ email: "", bio: "" });
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  console.log("Profile data:", user);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        setFormData({ email: res.data.email, bio: res.data.bio || "" });
      } catch (err) {
        console.error("Error fetching profile", err);
        if (err.response?.status === 401) {
          navigate("/");
        }
      }
    };

    fetchProfile();
  }, [navigate, token]);



  const handleUpdate = async () => {
  // Create the cleaned payload
  let payload = {
    email: formData.email,
    phone: formData.phone,
    age: formData.age ? parseInt(formData.age) : undefined,
    gender: formData.gender,
    specialty: formData.specialty || undefined,
    experience: formData.experience ? parseInt(formData.experience) : undefined,
    about: formData.bio || undefined,  // matches FastAPI field name
  };
  
  // Filter out undefined values
  payload = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );

  console.log("Cleaned payload:", payload);
  
  try {
    // Use the cleaned payload here instead of formData
    const res = await axios.put(`${API_BASE_URL}/profile`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    // Check the structure of the response
    console.log("Server response:", res.data);
    
    // Assuming res.data.data contains the updated profile information
    // Update the profile state with the updated data
    if (res.data && res.data.data) {
      // Important: Map 'about' back to 'bio' for frontend consistency
      const updatedProfile = {
        ...profile,
        ...res.data.data,
        bio: res.data.data.about || profile.bio // Make sure bio is updated from the 'about' field
      };
      setProfile(updatedProfile);
    } else {
      // If the structure is different, adapt accordingly
      const updatedProfile = {
        ...profile,
        ...res.data,
        // Make sure to map any fields that might have different names
        bio: res.data.about || profile.bio
      };
      setProfile(updatedProfile);
    }
    
    setEditMode(false);
  } catch (err) {
    console.error("Failed to update profile", err);
    if (err.response && err.response.data) {
      console.error("Server error details:", err.response.data);
    }
  }
};
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  if (!profile) return <p>Loading profile...</p>;

return (
  <div className="main-container">
    <div className="sidebar">
      <ul>
        <li onClick={() => navigate('/appointment')} className="active">Appointments</li>
        {/* <li onClick={() => navigate('/consultation')}>Consultation</li> */}
        <li onClick={() => navigate('/medicalrecords')}>Medical Records</li>
        <li onClick={() => navigate('/medicineordering')}>E-Pharmacy</li>
        <li onClick={() => navigate('/payment')}>Billing</li>
        <li onClick={() => navigate('/feedback')}>Feedback</li>
        {/* <li onClick={() => navigate('/appointment')}>Settings</li> */}
      </ul>
      <div className="image" onClick={()=>navigate('/profile')}>
       <img id="profile-icon" src={profilelogo}></img>
       <p id="profile-username">{profile.username}</p>
      </div>
    </div>

    <div className="profile-wrapper">
      <div className="profile-container">
        <h2>Profile</h2>
        <p><strong>Username:</strong> {profile.username}</p>
        {/* <p><strong>Role:</strong> {profile.role}</p> */}


        {editMode ? (
          <>
            <div className="profile-field">
              <label>Email:</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label>Phone:</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label>Age:</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="profile-field">
              <label >Gender:</label>
              <select className="profile-gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>

            {profile.role === 'doctor' && (
              <>
                <div className="profile-field">
                  <label>Specialty:</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  />
                </div>
                <div className="profile-field">
                  <label>Experience (years):</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>
                <div className="profile-field">
                  <label>Bio:</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="profile-buttons">
              <button onClick={handleUpdate}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Age:</strong> {profile.age}</p>
            <p><strong>Gender:</strong> {profile.gender}</p>

            {profile.role === 'doctor' && (
              <>
                <p><strong>Specialization:</strong> {profile.specialty}</p>
                <p><strong>Experience:</strong> {profile.experience} years</p>
                <p><strong>Bio:</strong> {profile.bio?profile.bio :"None"}</p>
                <p><strong>Experience:</strong> {profile.experience}</p>
              </>
            )}

            <button id="edit-profile" onClick={() => {  setFormData({
      email: profile.email || '',
      phone: profile.phone || '',
      age: profile.age || '',
      gender: profile.gender || '',
      specialty: profile.specialty || '',
      experience: profile.experience || '',
      bio: profile.bio || ''
    });setEditMode(true)}}>Edit Profile</button>
          </>
        )}

        <hr />
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  </div>
);

};

export default ProfilePage;
