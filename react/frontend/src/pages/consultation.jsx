import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./consultation.css";
import {io} from 'socket.io-client';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiMonitor, FiStopCircle, FiPhoneOff, FiCircle } from "react-icons/fi";
const API_BASE_URL = import.meta.env.VITE_API_URL;


const Consultation = ({user}) => {
    console.log("USER:",user);
    const userID = user?.id;
    
    const navigate=useNavigate();
    console.log("USER ID:",userID);
    const { channel_name } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [isJoined, setIsJoined] = useState(false); // State to track if joined
  const [isCameraPermissionGranted, setIsCameraPermissionGranted] = useState(false); // Track camera permission
  const [isTokenFetched, setIsTokenFetched] = useState(false); // Track token fetch success
    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localTracks = useRef({});
    const [activeTab, setActiveTab] = useState("chat");
    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [noteText, setNoteText] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const rtmClient = useRef(null);
    const channel = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [focusedVideo, setFocusedVideo] = useState("remote"); // or "remote"

    const [doctorJoined, setDoctorJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const screenTrack = useRef(null);
    const [seconds, setSeconds] = useState(0);
    const mediaRecorderRef = useRef(null);
    const recordedChunks = useRef([]);
    const [isRecording, setIsRecording] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
    const socket = useRef(null);
    const [medicalRecords, setMedicalRecords] = useState([]);
const [patientId, setPatientId] = useState(null);

    const token = localStorage.getItem("token");
    // const tokenString = token ? JSON.parse(token) : null;
    // const userID = token?.id; 
    console.log("TOKEN:",token);
    
    const APP_ID = import.meta.env.VITE_AGORA_APP_ID;
    console.log("ENVIRONMENT IMPORTS",import.meta.env);

   useEffect(() => {
  socket.current = io(`${API_BASE_URL}`, {
    transports: ["websocket", "polling"],
  });

  socket.current.on("connect", () => {
    console.log("Connected to server");
    socket.current.emit("join_room", channel_name);
  });

  socket.current.on("receive_message", (message) => {
    console.log("Received message:", message);
    setChatMessages((prevMessages) => [...prevMessages, message]);
  });
    socket.current.on("receive_document", (file) => {
    console.log("Received document:", file);
    setUploadedFiles((prev) => [...prev, file]);
  });
  return () => {
    if (socket.current) {
      socket.current.disconnect();
    }
  };
}, [channel_name]);


useEffect(() => {
   console.log("USEEFFECT triggered with appointment.id:", appointment?.id, "and user.role:", user?.role);
const fetchPatientAndRecords = async () => {
  console.log("PATIENT ID:", appointment.patient_id);
  try {
    if (user.role === 'specialist' && appointment.id) {
      const patientId = appointment.patient_id;
      setPatientId(patientId);

      const res2 = await axios.get(`/records/${appointment.patient_id}`);
      console.log("Fetched medical records:", res2.data.records);  // <-- log API response

      setMedicalRecords(res2.data.records);  // setting state
    }
  } catch (err) {
    console.error("Error fetching patient or records", err);
  }
};

    fetchPatientAndRecords();
    
}, [appointment?.id, user?.role]);

useEffect(() => {
  console.log("MEDICAL-RECORDS updated:", medicalRecords);
}, [medicalRecords]);


    const handleVideoClick = (videoType) => {
        setFocusedVideo(videoType);
      };

      

const handleCallEnd = async () => {
    console.log("Ending call for appointment:", appointment);
    
    if (!appointment || !appointment.id) {
        console.error("Cannot end call: Appointment data is missing");
        return;
    }
    
    // Make sure token is available and properly formatted
    const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) {
        console.error("Authentication token is missing");
        alert("You need to be logged in to end this call");
        return;
    }
    
    const payload = {
        appointment_id: appointment.id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        duration: Math.floor(seconds / 60),
        summary: "Consultation completed successfully",
    };

    console.log("Sending payload:", payload);
    console.log("Using authorization token:", authToken.substring(0, 10) + "...");
    
    try {
        // Attempt to leave the channel first to ensure it happens even if the API call fails
        console.log("Leaving channel first...");
        await leaveChannel();
        
        console.log("Attempting to post to consultation/complete endpoint with fetch");
        console.log("Full request URL:", `${API_BASE_URL}/consultation/complete`);
  
        
        // Make the actual API call
        const response = await fetch(`${API_BASE_URL}/consultation/complete`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
                "Accept": "application/json"
            },
            body: JSON.stringify(payload),
            // Adding these options to help diagnose CORS issues
            mode: 'cors',
            credentials: 'include'
        });
        
        console.log("Response received:", response);
        console.log("Response status:", response.status);
        
        if (response.ok) {
            try {
                const data = await response.json();
                console.log("Consultation API response data:", data);
            } catch (jsonError) {
                console.log("Could not parse JSON response:", jsonError);
                console.log("Raw response:", await response.text());
            }
            
            console.log("Consultation saved and appointment marked completed.");
            navigate("/appointment");
        } else {
            let errorMessage = `Status: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error("Error response data:", errorData);
                errorMessage += ` - ${errorData.detail || JSON.stringify(errorData)}`;
            } catch (e) {
                const errorText = await response.text();
                errorMessage += ` - ${errorText || "No error details available"}`;
            }
            
            console.error("Server returned error:", errorMessage);
            alert(`Failed to complete consultation. ${errorMessage}`);
            
            // Navigate anyway since we've already left the channel
            navigate("/appointment");
        }
    } catch (err) {
        console.error("Error during call end:", err);
        
        // Log more details about the error
        if (err.name) console.error("Error name:", err.name);
        if (err.message) console.error("Error message:", err.message);
        if (err.stack) console.error("Error stack:", err.stack);
        
        alert("Failed to complete the consultation. Network or server error: " + err.message);
        
        // Navigate anyway since we've already left the channel
        navigate("/appointment");
    }
};
    // const sendMessage = () => {
    //     if (chatInput.trim()) {
    //         setChatMessages(prevMessages => [...prevMessages, { sender: "Me", text: chatInput }]);
    //         setChatInput(""); // Clear input field after sending
    //     }
    // };
const sendMessage = () => {
  console.log("Send button clicked"); // Step 1 check

  if (chatInput.trim()) {
    const message = { sender: userID, text: chatInput, channel_name };
    console.log("Sending message:", message); // Step 2 check
    socket.current.emit('send_message', message);
    setChatInput("");
  } else {
    console.log("Chat input is empty or whitespace only");
  }
};



    
    useEffect(() => {
        const fetchAppointmentDetails = async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/appointments/${channel_name}`);
            if (!response.ok) {
              throw new Error('Failed to fetch appointment data');
            }
            const data = await response.json();
            console.log("DATA",data);
            setAppointment(data);  // Save appointment data to state
          } catch (error) {
            console.error('Error fetching appointment details:', error);
          }
        };
    
        fetchAppointmentDetails();
      }, [channel_name]);  // Re-run effect when channel_name changes
    
    console.log("Appointment:",appointment);
    
    const addNote = () => {
        if (noteText.trim()) {
            setNotes([...notes, noteText]);
            setNoteText("");
        }
    };

    // const handleFileUpload = (event) => {
    //     const file = event.target.files[0];
    //     if (file) {
    //         const newFile = {
    //             name: file.name,
    //             url: URL.createObjectURL(file),
    //         };
    //         setUploadedFiles(prev => [...prev, newFile]);
    //     }
    // };
    
    const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const newFile = {
      name: file.name,
      url: URL.createObjectURL(file), // for now it's local
    };

    setUploadedFiles(prev => [...prev, newFile]);

    // ⬅️ Send file info to the other side
    socket.current.emit("send_document", {
      name: newFile.name,
      url: newFile.url,
      channel_name,
    });
  }
};
    const renderTabContent = () => {
        if (activeTab === 'chat') {
            return (
                <div className="chat-tab">
  {/* <ul id="chat-msg">
  {chatMessages.map((msg, index) => (
    
    <li key={index}>
      <strong>{msg.sender === userID ? 'Me' : 'Them'}:</strong> {msg.text}
    </li>
  ))}
</ul> */}

{/* <ul id="chat-msg">
  {chatMessages.map((msg, index) => {
    console.log("msg.sender:", msg.sender, "userID:", userID, "Equal:", msg.sender.user === userID.user);
    
    return (
      <li key={index}>
        <strong>{msg.sender === userID ? 'Me' : 'Them'}:</strong> {msg.text}
      </li>
    );
  })}
</ul> */}
<ul id="chat-msg">
  {chatMessages.map((msg, index) => {
    const isMe = msg.sender === userID;
    return (
      <li
        key={index}
        className={`chat-message ${isMe ? 'sent' : 'received'}`}
      >
        <div className="message-bubble">
          <strong>{isMe ? 'Me' : 'Them'}:</strong> {msg.text}
        </div>
      </li>
    );
  })}
</ul>


                    <div id="place-at-bottom">
                    <textarea id="chat-text-area"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button id="send-button" onClick={sendMessage}>Send</button>
                </div>
                </div>
            );
        } else if (activeTab === 'notes') {
            return (
                <div className="notes-tab">
                    <ul id="note-msg">
                        {notes.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                    </ul>
                    <div id="place-at-bottom">
                    <textarea
                    id="note-text-area"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your note..."
                    />
                    <button id="add-note-button" onClick={addNote}>Add Note</button>
                </div>
                </div>
            );
          }
          else if (activeTab === 'docs') {
  return (
    <div className="docs-tab">
      {/* Upload Section */}
      <input type="file" onChange={handleFileUpload} />
      
      {/* Files uploaded in this session */}
      {uploadedFiles.length > 0 && (
        <div className="uploaded-section">
          <h4>Your Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index}>
              <p className="file-name"><strong>{file.name}</strong></p>
              <a href={file.url} target="_blank" rel="noopener noreferrer">View File</a>
            </div>
          ))}
        </div>
      )}
  
      {/* Medical Records (visible to doctors only) */}
      {user.role === 'specialist' && (
        <div className="medical-records-section">
          <h4>Patient Medical Records</h4>
          {medicalRecords.length === 0 ? (
            <p>No records available.</p>
          ) : (
            <ul>
              {medicalRecords.map((record) => (
                <li key={record.id}>
                  <p className="file-name"><strong>{record.title || 'Untitled'}</strong></p>
                  <a href={record.file_url} target="_blank" rel="noopener noreferrer">View Document</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}}
    //     } else if (activeTab === 'docs') {
    //       return (
    //              <div className="docs-tab">
    //                  <input
    //                     type="file"
    //                      onChange={handleFileUpload}
    //                  />
    //                  {uploadedFiles.map((file, index) => (
    //                      <div key={index}>
    //                          <p className="file-name"><strong>{file.name}</strong></p>
    //                          <a href={file.url} target="_blank" rel="noopener noreferrer">View File</a>
    //                      </div>
    //                  ))}
    //              </div>
    //          );
    //     }
        
    // };
    
  
   

    
    const joinChannel = useCallback(async () => {
        if (!appointment || !appointment.id) {
          console.error("❌ Appointment not loaded");
          return;
        }
        console.log(appointment);
          
        try {
          // Get token first
          const tokenResponse = await fetch(
            `${API_BASE_URL}/consultation/token?appointment_id=${appointment.id}&uid=0`
          );
          const tokenData = await tokenResponse.json();
              
          if (!tokenResponse.ok) {
            console.error("❌ Failed to get token:", tokenData.detail);
            return;
          }
          
          console.log("Token data:", tokenData);
          const { token, channel_name, uid } = tokenData;
          console.log("Token:", token);
          console.log("ChannelName:", channel_name);
          console.log("UID:", uid);
          console.log("App ID:", APP_ID);
          
          // Join channel first
          console.log("🔄 Joining Agora channel...");
          await client.current.join(APP_ID, channel_name, token, uid);
          
          // Try to get camera/mic access, but continue even if not available
          try {
            console.log("🔄 Requesting camera access...");
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setIsCameraPermissionGranted(true);
            
            // Create tracks if permission granted
            console.log("🎥 Creating camera tracks...");
            localTracks.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
            localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            
            if (localVideoRef.current && localTracks.current.videoTrack) {
              localTracks.current.videoTrack.play(localVideoRef.current);
            }
            
            // Publish available tracks
            const tracksToPublish = [];
            if (localTracks.current.videoTrack) tracksToPublish.push(localTracks.current.videoTrack);
            if (localTracks.current.audioTrack) tracksToPublish.push(localTracks.current.audioTrack);
            
            if (tracksToPublish.length > 0) {
              console.log("📡 Publishing tracks:", tracksToPublish.length);
              await client.current.publish(tracksToPublish);
            }
            
          } catch (mediaError) {
            console.warn("⚠️ Could not access camera/microphone:", mediaError);
            setIsCameraPermissionGranted(false);
            
            // Continue without camera/mic - user can still see remote participant
            console.log("Continuing without local media devices");
            
            // Try to get audio only if video fails
            try {
              console.log("Trying audio only...");
              localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
              await client.current.publish([localTracks.current.audioTrack]);
            } catch (audioError) {
              console.warn("Could not access microphone either:", audioError);
            }
          }
          
          // Set joined status regardless of camera access
          setJoined(true);
          setIsTokenFetched(true);
          
        } catch (error) {
          console.error("❌ Error in joinChannel:", error);
        }
      }, [appointment]);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleString()); // Update every second
        }, 1000);
    
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);
    

    const leaveChannel = useCallback(async () => {
        try {
          // Close video track if it exists
          if (localTracks.current.videoTrack) {
            localTracks.current.videoTrack.stop();
            localTracks.current.videoTrack.close();
          }
          
          // Close audio track if it exists
          if (localTracks.current.audioTrack) {
            localTracks.current.audioTrack.stop();
            localTracks.current.audioTrack.close();
          }
          
          // Reset state
          localTracks.current = {};
          
          // Leave client channel
          if (client.current) {
            await client.current.leave();
          }
          
          // Reset states
          setJoined(false);
          setDoctorJoined(false);
          setIsCameraPermissionGranted(false);
          setIsTokenFetched(false);
          
          // Close RTM if using it
          if (channel.current) await channel.current.leave();
          if (rtmClient.current) await rtmClient.current.logout();
          
        } catch (error) {
          console.error("Error leaving the channel:", error);
        }
      }, []);
    const handleUserPublished = async (user, mediaType) => {
        console.log("User published:", user, "Media type:", mediaType);
        
        await client.current.subscribe(user, mediaType);
    
        if (mediaType === "video") {
            if (remoteVideoRef.current) {
                console.log("Playing remote video...");
                user.videoTrack.play(remoteVideoRef.current);
            } else {
                console.error("Remote video container is not available");
            }
            setDoctorJoined(true);
        }
        console.log("Video track before playing:", user.videoTrack);

    
        if (mediaType === "audio") {
            user.audioTrack.play();
        }
    };
    const CameraStatus = () => {
        if (!joined) {
          return <div className="status-indicator">Not connected</div>;
        }
        
        if (!isCameraPermissionGranted) {
          return <div className="status-indicator warning">Viewing only (no camera access)</div>;
        }
        
        return <div className="status-indicator success">Connected with camera</div>;
      };

    useEffect(() => {
        const handleUserPublished = async (user, mediaType) => {
            await client.current.subscribe(user, mediaType);
    
            if (mediaType === "video") {
                if (remoteVideoRef.current) {
                    user.videoTrack.play(remoteVideoRef.current);
                }
                setDoctorJoined(true);
            }
    
            if (mediaType === "audio") {
                user.audioTrack.play();
            }
        };
    
        client.current.on("user-published", handleUserPublished);
    
        return () => {
            client.current.off("user-published", handleUserPublished);
            leaveChannel();
        };
    }, [leaveChannel]);
    
    useEffect(() => {
        let interval;
        if (joined) {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            setSeconds(0);
        }
        return () => clearInterval(interval);
    }, [joined]);

    const toggleMute = () => {
        if (localTracks.current.audioTrack) {
            localTracks.current.audioTrack.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localTracks.current.videoTrack) {
            localTracks.current.videoTrack.setEnabled(!isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleScreenShare = async () => {
        if (!isScreenSharing) {
            screenTrack.current = await AgoraRTC.createScreenVideoTrack();
            await client.current.unpublish(localTracks.current.videoTrack);
            await client.current.publish(screenTrack.current);
            setIsScreenSharing(true);
        } else {
            await client.current.unpublish(screenTrack.current);
            await client.current.publish(localTracks.current.videoTrack);
            screenTrack.current.close();
            setIsScreenSharing(false);
        }
    };

    const toggleRecording = async () => {
        if (!isRecording) {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) recordedChunks.current.push(event.data);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } else {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            const blob = new Blob(recordedChunks.current, { type: "video/webm" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "consultation-recording.webm";
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
        }
          

    };

    return (
        <div className="consultation-page">
        <div className="consultation-container">
            
            <div className="info-container">
                
                    {/* <h4>Appointment Details</h4> */}
                    {/* <p><strong>Patient:</strong> {patient.name}</p> */}
                    {/* <p><strong>Reason:</strong> {patient.reason}</p> */}
                    <p><strong>Date & Time:</strong> {currentTime || "Loading..."}</p>
                                

                
            </div>
            {/* <div className="status-indicator">Doctor Status: {doctorJoined ? "🟢 Online" : "🔴 Offline"}</div> */}
            <div className="video-container">
            <div className="video-frame">
    {/* Remote Video */}
    <video
            ref={remoteVideoRef}
            className={`remote-video ${focusedVideo === 'remote' ? 'focused' : ''}`}
            onClick={() => handleVideoClick('remote')}
          />

    {/* Local Video */}
    <video
            ref={localVideoRef}
            className={`local-video ${focusedVideo === 'local' ? 'focused' : ''}`}
            onClick={() => handleVideoClick('local')}
          />
          <div className="video-label">
            {/* {focusedVideo === 'remote' ? 'Patient View' : 'Your View'} */}
          </div>
  </div>
</div>


            <p>Call Duration: {Math.floor(seconds / 60)}m {seconds % 60}s</p>
            <div className="button-container">
                {!joined ? (
                    <button className="button join-button" onClick={joinChannel}>Join Call</button>
                ) : (
                    <>
                        <button className="button" onClick={toggleMute} title="Toggle Mute">
                        {isMuted ? <FiMicOff size={20} /> : <FiMic size={20} />}
                        </button>

                        <button className="button" onClick={toggleVideo} title="Toggle Video">
                        {isVideoEnabled ? <FiVideo size={20} /> : <FiVideoOff size={20} />}
                        </button>

                        <button className="button" onClick={toggleScreenShare} title="Toggle Screen Share">
                        {isScreenSharing ? <FiMonitor size={20} /> : <FiMonitor size={20} color="black" />}
                        </button>

                        {/* <button className="button" onClick={toggleRecording} title="Toggle Recording">
                        {isRecording ? <FiStopCircle /> : <FiCircle />}
                        </button> */}

                        {/* <button className="button leave-button" onClick={() => leaveChannel().then(() => window.location.reload())} title="End Call"> */}
                        <button className="button leave-button" onClick={handleCallEnd} title="End Call">
    <FiPhoneOff size={20} />
</button>

                    </>
                    )}
            </div>
        </div>

        {joined && (
            <div className="consultation-tabs">
                <div className="tab-header">
                    <button id="b1"
                        className={activeTab === 'chat' ? 'active' : ''}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat
                    </button>
                    <button id="b2"
                        className={activeTab === 'notes' ? 'active' : ''}
                        onClick={() => setActiveTab('notes')}
                    >
                        Notes
                    </button>
                    <button id="b3"
                        className={activeTab === 'docs' ? 'active' : ''}
                        onClick={() => setActiveTab('docs')}
                    >
                        Docs
                    </button>
                </div>
                {renderTabContent()}
            </div>
        )}


    </div>

    );



};

export default Consultation;