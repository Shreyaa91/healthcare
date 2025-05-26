import React, { useState, useEffect } from "react";
import axios from "axios";
import './medicalrecords.css'
import { useNavigate } from "react-router-dom";
import profilelogo from "./image.png";
const API_BASE_URL = import.meta.env.VITE_API_URL; 


const MedicalRecords = ({ userId,user}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [records, setRecords] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate('/');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/records/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRecords(response.data.records || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      setError("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    console.log("INSIDE HANDLE")
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/');
      return;
    }

    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Only PDF, JPEG, PNG, or TXT files are allowed");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      console.log("MEDICAL RECORDS:",userId);
      await axios.post(`${API_BASE_URL}/upload_record/${userId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      setSelectedFile(null);
      await fetchRecords();
    } catch (error) {
      console.error("Upload failed:", error);
      setError(error.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  return (
    <div className="medical-records-container">
      <div className="sidebar">
        <ul>
          <li onClick={() => navigate('/appointment')}>Appointments</li>
          {/* <li onClick={() => navigate('/consultation')}>Consultation</li> */}
          <li className="active">Medical Records</li>
          <li onClick={() => navigate('/medicineordering')}>E-Pharmacy</li>
          <li onClick={() => navigate('/payment')}>Billing</li>
          <li onClick={() => navigate('/feedback')}>Feedback</li>
        </ul>
           <div className="image" onClick={()=>navigate('/profile')}>
               <img id="profile-icon" src={profilelogo}></img>
               <p id="profile-username">{user?.username}</p>
              </div>
      </div>
  
      <div className="records-main">
        <h2>Your Medical Records</h2>
        <div className="upload-section">
          <input
            type="file"
            onChange={(e) => {
              setSelectedFile(e.target.files[0]);
              setError(null);
            }}
            accept=".pdf,.jpg,.jpeg,.png,.txt"
          /><br/>
          <button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Upload Record"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
        {/* Grid View of Records */}
        <div className="records-grid">
          {loading ? (
            <p>Loading records...</p>
          ) : records.length === 0 ? (
            <p>No records found.</p>
          ) : (
            records.map((rec, idx) => (
              <div key={idx} className="record-card">
                <a href={rec.url} target="_blank" rel="noopener noreferrer">
                  {rec.file_name || `Record ${idx + 1}`}
                </a>
              </div>
            ))
          )}
        </div>
  
        {/* Upload Section */}
        {/* <div className="upload-section">
          <input
            type="file"
            onChange={(e) => {
              setSelectedFile(e.target.files[0]);
              setError(null);
            }}
            accept=".pdf,.jpg,.jpeg,.png,.txt"
          /><br/>
          <button onClick={handleUpload} disabled={uploading || !selectedFile}>
            {uploading ? "Uploading..." : "Upload Record"}
          </button>
          {error && <div className="error-message">{error}</div>}
        </div> */}
      </div>
    </div>
  );
  
};

export default MedicalRecords;