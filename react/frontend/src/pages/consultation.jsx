import { useState, useEffect, useRef } from "react";
import AgoraRTC from "agora-rtc-sdk-ng";
import './consultation.css'

const APP_ID = "e033326f78f74bac91c57b3b5d5c82e5";
const CHANNEL_NAME = "Channel1";
const TEMP_TOKEN = "007eJxTYODtuXjWb+cb/pmn75SsusHP68nNXn+x/4XgyrMBpZfTnCUVGFINjI2NjczSzC3SzE2SEpMtDZNNzZOMk0xTTJMtjFJNp2ndTW8IZGTg/H6OhZEBAkF8DgbnjMS8vNQcQwYGAN8GIQY="; // Replace with your token (needed if security is enabled)

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
// const Consultation = () => {
//     const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
//     const localVideoRef = useRef(null);
//     const remoteVideoRef = useRef(null);
//     const [joined, setJoined] = useState(false);
  
//     useEffect(() => {
//       const joinChannel = async () => {
//         client.current.on("user-published", async (user, mediaType) => {
//           await client.current.subscribe(user, mediaType);
//           if (mediaType === "video") {
//             const remoteTrack = user.videoTrack;
//             remoteTrack.play(remoteVideoRef.current);
//           }
//         });
  
//         await client.current.join(APP_ID, CHANNEL_NAME, TOKEN, null);
  
//         const localTrack = await AgoraRTC.createCameraVideoTrack();
//         localTrack.play(localVideoRef.current);
//         await client.current.publish(localTrack);
        
//         setJoined(true);
//       };
  
//       return () => {
//         client.current.leave();
//       };
//     }, []);
  
//     return (
//       <div className="consultation-container">
//         <h2 className="consultation-title">Agora Video Consultation</h2>
  
//         <div className="video-container">
//           <div className="video-box">
//             <h3>Your Video</h3>
//             <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}></div>
//           </div>
//           <div className="video-box">
//             <h3>Remote Video</h3>
//             <div ref={remoteVideoRef} style={{ width: "100%", height: "100%" }}></div>
//           </div>
//         </div>
  
//         <div className="button-container">
//           {!joined ? (
//             <button className="button join-button" onClick={() => joinChannel()}>Join Call</button>
//           ) : (
//             <button className="button leave-button" onClick={() => client.current.leave()}>Leave Call</button>
//           )}
//         </div>
//       </div>
//     );
//   };
  
//   export default Consultation;


const Consultation = () => {
    const client = useRef(AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }));
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [joined, setJoined] = useState(false);
    const localTracks = useRef({});
  
    const joinChannel = async () => {
      try {
        client.current.on("user-published", async (user, mediaType) => {
          await client.current.subscribe(user, mediaType);
          if (mediaType === "video") {
            const remoteTrack = user.videoTrack;
            remoteTrack.play(remoteVideoRef.current);
          }
          if (mediaType === "audio") {
            user.audioTrack.play();
          }
        });
  
        await client.current.join(APP_ID, CHANNEL_NAME, TOKEN, null);
  
        localTracks.current.videoTrack = await AgoraRTC.createCameraVideoTrack();
        localTracks.current.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  
        localTracks.current.videoTrack.play(localVideoRef.current);
        await client.current.publish([localTracks.current.videoTrack, localTracks.current.audioTrack]);
  
        setJoined(true);
      } catch (error) {
        console.error("Error joining the channel:", error);
      }
    };
  
    const leaveChannel = async () => {
      for (let trackName in localTracks.current) {
        localTracks.current[trackName].stop();
        localTracks.current[trackName].close();
      }
      await client.current.leave();
      setJoined(false);
    };
  
    useEffect(() => {
      return () => {
        leaveChannel(); // Clean up on unmount
      };
    }, []);
  
    return (
      <div className="consultation-container">
        <h2 className="consultation-title">Agora Video Consultation</h2>
  
        <div className="video-container">
          <div className="video-box">
            <h3>Your Video</h3>
            <div ref={localVideoRef} style={{ width: "100%", height: "100%" }}></div>
          </div>
          <div className="video-box">
            <h3>Remote Video</h3>
            <div ref={remoteVideoRef} style={{ width: "100%", height: "100%" }}></div>
          </div>
        </div>
  
        <div className="button-container">
          {!joined ? (
            <button className="button join-button" onClick={joinChannel}>Join Call</button>
          ) : (
            <button className="button leave-button" onClick={leaveChannel}>Leave Call</button>
          )}
        </div>
      </div>
    );
  };
  
  export default Consultation;