// import { useState, useEffect, useRef, useCallback } from "react";
// import AgoraRTC from "agora-rtc-sdk-ng";
// import './consultation.css';

// const APP_ID = "e033326f78f74bac91c57b3b5d5c82e5";
// const CHANNEL_NAME = "Channel1";
// const TEMP_TOKEN = "007eJxTYODtuXjWb+cb/pmn75SsusHP68nNXn+x/4XgyrMBpZfTnCUVGFINjI2NjczSzC3SzE2SEpMtDZNNzZOMk0xTTJMtjFJNp2ndTW8IZGTg/H6OhZEBAkF8DgbnjMS8vNQcQwYGAN8GIQY="; 

// const Consultation = () => {
//     const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const localTracks = useRef({});
//     const [joined, setJoined] = useState(false);

   
//     const joinChannel = useCallback(async () => {
//         try {
//             await client.current.join(APP_ID, CHANNEL_NAME, TEMP_TOKEN, null);
    
//             localTracks.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
//             localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    
//             if (localVideoRef.current) {
//                 localTracks.current.videoTrack.play(localVideoRef.current);
//             } else {
//                 console.error("Local video container not found.");
//             }
    
//             await client.current.publish([localTracks.current.videoTrack, localTracks.current.audioTrack]);
    
//             setJoined(true);
//         } catch (error) {
//             console.error("Error joining the channel:", error);
//         }
//     }, []);
    
    
//     const leaveChannel = useCallback(async () => {
//         for (let trackName in localTracks.current) {
//             localTracks.current[trackName].stop();
//             localTracks.current[trackName].close();
//         }
//         await client.current.leave();
//         setJoined(false);
//     }, []);
    

   
//     const handleUserPublished = async (user, mediaType) => {
//         await client.current.subscribe(user, mediaType);
//         console.log("User Published:", user, "Media Type:", mediaType);
    
//         if (mediaType === "video") {
//             if (remoteVideoRef.current) {
//                 user.videoTrack.play(remoteVideoRef.current);
//             } else {
//                 console.error("Remote video container not found.");
//             }
//         } else if (mediaType === "audio") {
//             user.audioTrack.play();
//         }
//     };
    
//     useEffect(() => {
//         client.current.on("user-published", handleUserPublished);
    
//         return () => {
//             client.current.off("user-published", handleUserPublished);
//             leaveChannel();
//         };
//     }, [handleUserPublished, leaveChannel]);

//     return (
//         <div className="consultation-container">
//             <h2 className="consultation-title">Video Consultation</h2>

//             <div className="video-container">
//                 <div className="video-box">
                    
//                     <div ref={localVideoRef} className="video-frame"><h3>Your Video</h3></div>
//                 </div>
//                 <div className="video-box">
                    
//                     <div ref={remoteVideoRef} className="video-frame"><h3>Remote Video</h3></div>
//                 </div>
//             </div>

//             <div className="button-container">
//                 {!joined ? (
//                     <button className="button join-button" onClick={joinChannel}>Join Call</button>
//                 ) : (
//                     <button className="button leave-button" onClick={leaveChannel}>Leave Call</button>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Consultation;

// const Consultation = () => {
//     const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const localTracks = useRef({});
//     const [joined, setJoined] = useState(false);

//     // Chat State
//     const [chatOpen, setChatOpen] = useState(false);
//     const [messages, setMessages] = useState([]);
//     const [message, setMessage] = useState("");

//     // Agora RTM Client
//     const rtmClient = useRef(null);
//     const channel = useRef(null);

//     //  Join Channel Function
//     const joinChannel = useCallback(async () => {
//         try {
//             await client.current.join(APP_ID, CHANNEL_NAME, TEMP_TOKEN, null);

//             localTracks.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
//             localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

//             if (localVideoRef.current) {
//                 localTracks.current.videoTrack.play(localVideoRef.current);
//             }

//             await client.current.publish([localTracks.current.videoTrack, localTracks.current.audioTrack]);
//             setJoined(true);

//             // Join RTM (Chat)
//             rtmClient.current = AgoraRTM.createInstance(APP_ID);
//             await rtmClient.current.login({ uid: String(Date.now()), token: RTM_TOKEN });

//             channel.current = rtmClient.current.createChannel(CHANNEL_NAME);
//             await channel.current.join();

//             // Handle incoming messages
//             channel.current.on("ChannelMessage", ({ text }, senderId) => {
//                 setMessages((prev) => [...prev, { sender: senderId, text }]);
//             });

//         } catch (error) {
//             console.error("Error joining the channel:", error);
//         }
//     }, []);

//     //  Leave Channel Function
//     const leaveChannel = useCallback(async () => {
//         for (let trackName in localTracks.current) {
//             localTracks.current[trackName].stop();
//             localTracks.current[trackName].close();
//         }
//         await client.current.leave();

//         if (channel.current) {
//             await channel.current.leave();
//         }
//         if (rtmClient.current) {
//             await rtmClient.current.logout();
//         }

//         setJoined(false);
//     }, []);

//     // Handle User Published Events
//     useEffect(() => {
//         const handleUserPublished = async (user, mediaType) => {
//             await client.current.subscribe(user, mediaType);
//             if (mediaType === "video") {
//                 if (remoteVideoRef.current) {
//                     user.videoTrack.play(remoteVideoRef.current);
//                 }
//             } else if (mediaType === "audio") {
//                 user.audioTrack.play();
//             }
//         };

//         client.current.on("user-published", handleUserPublished);

//         return () => {
//             client.current.off("user-published", handleUserPublished);
//             leaveChannel();
//         };
//     }, [leaveChannel]);

//     //  Send Message Function
//     const sendMessage = async () => {
//         if (channel.current && message.trim()) {
//             await channel.current.sendMessage({ text: message });
//             setMessages([...messages, { sender: "Me", text: message }]);
//             setMessage("");
//         }
//     };

//     return (
//         <div className="consultation-container">
//             <h2 className="consultation-title">Agora Video Consultation</h2>

//             <div className="video-container">
//                 <div className="video-box">
//                     <h3>Your Video</h3>
//                     <div ref={localVideoRef} className="video-frame"></div>
//                 </div>
//                 <div className="video-box">
//                     <h3>Remote Video</h3>
//                     <div ref={remoteVideoRef} className="video-frame"></div>
//                 </div>
//             </div>

//             {/* Buttons */}
//             <div className="button-container">
//                 {!joined ? (
//                     <button className="button join-button" onClick={joinChannel}>Join Call</button>
//                 ) : (
//                     <button className="button leave-button" onClick={leaveChannel}>Leave Call</button>
//                 )}
//                 <button className="button chat-button" onClick={() => setChatOpen(!chatOpen)}>
//                     {chatOpen ? "Close Chat" : "Open Chat"}
//                 </button>
//             </div>

//             {/* Chatbox */}
//             {chatOpen && (
//                 <div className="chat-box">
//                     <div className="chat-header">Chat</div>
//                     <div className="chat-messages">
//                         {messages.map((msg, index) => (
//                             <div key={index} className={`chat-message ${msg.sender === "Me" ? "sent" : "received"}`}>
//                                 <strong>{msg.sender}:</strong> {msg.text}
//                             </div>
//                         ))}
//                     </div>
//                     <div className="chat-input">
//                         <input
//                             type="text"
//                             value={message}
//                             onChange={(e) => setMessage(e.target.value)}
//                             placeholder="Type a message..."
//                         />
//                         <button onClick={sendMessage}>Send</button>
//                     </div>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default Consultation;


import { useState, useEffect, useRef, useCallback } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import "./consultation.css";
// import { useState, useEffect } from "react";

const APP_ID = "e033326f78f74bac91c57b3b5d5c82e5";
const CHANNEL_NAME = "Channel1";
const TEMP_TOKEN = "007eJxTYODtuXjWb+cb/pmn75SsusHP68nNXn+x/4XgyrMBpZfTnCUVGFINjI2NjczSzC3SzE2SEpMtDZNNzZOMk0xTTJMtjFJNp2ndTW8IZGTg/H6OhZEBAkF8DgbnjMS8vNQcQwYGAN8GIQY=";
const RTM_TOKEN = "your_rtm_token_here";

const Consultation = () => {
    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localTracks = useRef({});
    const [joined, setJoined] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [notesOpen, setNotesOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [noteText, setNoteText] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const rtmClient = useRef(null);
    const channel = useRef(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");

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


    const doctor = { name: "Dr. John Doe", specialty: "Cardiologist", profilePic: "https://via.placeholder.com/80" };
    const patient = { name: "Jane Smith", reason: "Heart Checkup", appointmentTime: "March 26, 2025 - 10:30 AM", profilePic: "https://via.placeholder.com/80" };

    const sendMessage = () => {
        if (chatInput.trim()) {
            setChatMessages(prevMessages => [...prevMessages, { sender: "Me", text: chatInput }]);
            setChatInput(""); // Clear input field after sending
        }
    };
    
    const addNote = () => {
        if (noteText.trim()) {
            setNotes([...notes, noteText]);
            setNoteText("");
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setUploadedFile({
                name: file.name,
                url: URL.createObjectURL(file), // Creates a preview URL
            });
        }
    };
    

    const joinChannel = useCallback(async () => {
        try {
            await client.current.join(APP_ID, CHANNEL_NAME, TEMP_TOKEN, null);
            localTracks.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
            localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            if (localVideoRef.current) localTracks.current.videoTrack.play(localVideoRef.current);
            await client.current.publish([localTracks.current.videoTrack, localTracks.current.audioTrack]);
            setJoined(true);

            rtmClient.current = AgoraRTC.createInstance(APP_ID);
            await rtmClient.current.login({ uid: String(Date.now()), token: RTM_TOKEN });
            channel.current = rtmClient.current.createChannel(CHANNEL_NAME);
            await channel.current.join();
            channel.current.on("ChannelMessage", ({ text }, senderId) => {
                setMessages((prev) => [...prev, { sender: senderId, text }]);
            });
        } catch (error) {
            console.error("Error joining the channel:", error);
        }
    }, []);
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleString()); // Update every second
        }, 1000);
    
        return () => clearInterval(interval); // Cleanup on unmount
    }, []);
    
    const leaveChannel = useCallback(async () => {
        for (let trackName in localTracks.current) {
            localTracks.current[trackName].stop();
            localTracks.current[trackName].close();
        }
        await client.current.leave();
        if (channel.current) await channel.current.leave();
        if (rtmClient.current) await rtmClient.current.logout();
        setJoined(false);
    }, []);

    useEffect(() => {
        const handleUserPublished = async (user, mediaType) => {
            await client.current.subscribe(user, mediaType);
            if (mediaType === "video" && remoteVideoRef.current) {
                user.videoTrack.play(remoteVideoRef.current);
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

    // const sendMessage = async () => {
    //     if (channel.current && message.trim()) {
    //         await channel.current.sendMessage({ text: message });
    //         setMessages([...messages, { sender: "Me", text: message }]);
    //         setMessage("");
    //     }
    // };

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
        <div className="consultation-container">
            <div className="info-container">
                <div className="user-info">
                    {/* <img src={doctor.profilePic} alt="Doctor" className="profile-pic"/> */}
                    {/* <div>
                        <h3>{doctor.name}</h3>
                        <p>{doctor.specialty}</p>
                    </div> */}
                </div>
                <div className="appointment-info">
                    {/* <h4>Appointment Details</h4> */}
                    {/* <p><strong>Patient:</strong> {patient.name}</p> */}
                    {/* <p><strong>Reason:</strong> {patient.reason}</p> */}
                    <p><strong>Date & Time:</strong> {currentTime || "Loading..."}</p>


                </div>
            </div>
            <div className="status-indicator">Doctor Status: {doctorJoined ? "🟢 Online" : "🔴 Offline"}</div>
            <div className="video-container">
                <div ref={localVideoRef} className="video-frame">
                <p><strong>Patient:</strong> {patient.name}</p>
                </div>
                <div ref={remoteVideoRef} className="video-frame">
                <p><strong></strong>{doctor.name}, {doctor.specialty}</p>
                </div>
            </div>
            <p>Call Duration: {Math.floor(seconds / 60)}m {seconds % 60}s</p>
            <div className="button-container">
                <button className="button" onClick={toggleMute}>{isMuted ? "Unmute" : "Mute"}</button>
                <button className="button" onClick={toggleVideo}>{isVideoEnabled ? "Disable Video" : "Enable Video"}</button>
                <button className="button" onClick={toggleScreenShare}>{isScreenSharing ? "Stop Sharing" : "Share Screen"}</button>
                <button className="button" onClick={toggleRecording}>{isRecording ? "Stop Recording" : "Start Recording"}</button>
                <button className="button" onClick={() => setChatOpen(!chatOpen)}>Chat</button>
                <button className="button" onClick={() => setNotesOpen(!notesOpen)}>Notes</button>
                <button className="button" onClick={() => document.getElementById("fileInput").click()}>Upload Document</button>
                <input type="file" id="fileInput" style={{ display: "none" }} onChange={handleFileUpload} />

                <button className="button leave-button" onClick={() => window.location.reload()}>End Call</button>
            </div>
            {/* File Input (Hidden) */}
            <input
                type="file"
                id="fileInput"
                style={{ display: "none" }}
                onChange={handleFileUpload}
            />
            {/* Chat Box */}
            {/* Chat Box */}
            {chatOpen && (
                <div className="chat-box">
                    <h3>Chat</h3>
                    <div className="chat-messages">
                        {chatMessages.map((msg, index) => (
                            <p key={index}><strong>{msg.sender}:</strong> {msg.text}</p>
                        ))}
                    </div>
                    <div className="chat-input">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button className="button" onClick={sendMessage}>Send</button>
                    </div>
                </div>
            )}


            {/* Notes Section */}
            {notesOpen && (
                <div className="notes-box">
                    <h3>Notes</h3>
                    <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Write your note..."
                    />
                    <button className="button" onClick={addNote}>Add Note</button>
                    <ul>
                        {notes.map((note, index) => (
                            <li key={index}>{note}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Uploaded File Display */}
            {uploadedFile && (
    <div className="file-box">
        <p>Uploaded: <strong>{uploadedFile.name}</strong></p>
        <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">View File</a>
    </div>
)}

        </div>
    );
};

export default Consultation;