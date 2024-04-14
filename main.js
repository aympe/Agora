// Define global variables for Agora client and local streams
let client;
let localTracks = {
  videoTrack: null,
  audioTrack: null,
};

// Configuration for your Agora client - replace with your own App ID
const AGORA_APP_ID = "YOUR_AGORA_APP_Ia39c70c4d8974c89ad56a89655a1dbf1";

async function startBasicLiveStreaming(channelName, token) {
  // Create and initialize the client in RTC mode
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(AGORA_APP_ID, channelName, token, null);

  // Create and publish the local tracks
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

  // Set up the local video stream container
  const box = document.getElementById("box");
  const localVideoDiv = document.createElement("div");
  localVideoDiv.id = "local-stream";
  localVideoDiv.className = "video-container"; // Assign class
  box.appendChild(localVideoDiv);
  localTracks.videoTrack.play("local-stream");

  // Publish the local streams
  await client.publish(Object.values(localTracks));
  console.log("Publishing local streams");

  // Subscribe to remote streams
  client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    console.log("Subscribed to user:", user.uid);

    if (mediaType === "video") {
      let remoteVideoDivId = `remote-video-${user.uid}`;
      if (!document.getElementById(remoteVideoDivId)) {
        let playerDiv = document.createElement("div");
        playerDiv.id = remoteVideoDivId;
        playerDiv.className = "video-container"; // Assign class
        box.appendChild(playerDiv);
        user.videoTrack.play(remoteVideoDivId);
      }
    }

    if (mediaType === "audio") {
      user.audioTrack.play(); // Audio is played but not displayed
    }
  });

  client.on("user-unpublished", (user, mediaType) => {
    console.log(`User unpublished ${user.uid}`);
    // Remove the video element when they are no longer publishing
    if (mediaType === "video") {
      let remoteVideoDiv = document.getElementById(`remote-video-${user.uid}`);
      if (remoteVideoDiv) {
        remoteVideoDiv.parentNode.removeChild(remoteVideoDiv);
      }
    }
  });

  client.on("user-left", (user) => {
    console.log(`User left ${user.uid}`);
    // Remove the video element if the user leaves the channel
    let remoteVideoDiv = document.getElementById(`remote-video-${user.uid}`);
    if (remoteVideoDiv) {
      remoteVideoDiv.parentNode.removeChild(remoteVideoDiv);
    }
  });
}
