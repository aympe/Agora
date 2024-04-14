// Define global variables for Agora client and local streams
let client;
let remoteUsers = {};
let localTracks = {
  videoTrack: null,
  audioTrack: null,
};

// Configuration for your Agora client - replace with your own App ID
const AGORA_APP_ID = "a39c70c4d8974c89ad56a89655a1dbf1";

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

  // Handle user-published events
  client.on("user-published", async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    console.log("Subscribed to user:", user.uid);
    remoteUsers[user.uid] = user; // Add user to the list

    if (mediaType === "video") {
      handleRemoteVideo(user);
    }

    if (mediaType === "audio") {
      user.audioTrack.play(); // Assumes there is a way to handle audio globally
    }
  });

  client.on("user-unpublished", (user) => {
    console.log(`User unpublished ${user.uid}`);
    removeVideoContainer(user.uid);
    delete remoteUsers[user.uid]; // Remove user from the list
  });

  client.on("user-left", (user) => {
    console.log(`User left ${user.uid}`);
    removeVideoContainer(user.uid);
    delete remoteUsers[user.uid]; // Remove user from the list
  });
}

function handleRemoteVideo(user) {
  const box = document.getElementById("box");
  const remoteVideoDivId = `remote-video-${user.uid}`;
  let playerDiv = document.getElementById(remoteVideoDivId);

  if (!playerDiv) {
    playerDiv = document.createElement("div");
    playerDiv.id = remoteVideoDivId;
    playerDiv.className = "video-container"; // Assign class
    box.appendChild(playerDiv);
  }
  user.videoTrack.play(remoteVideoDivId);
}

function removeVideoContainer(uid) {
  const videoContainer = document.getElementById(`remote-video-${uid}`);
  if (videoContainer) {
    videoContainer.parentNode.removeChild(videoContainer);
  }
}

function checkAndDisplayRemoteUsers() {
  console.log("Checking for remote users...");
  for (const uid in remoteUsers) {
    console.log(`Remote user UID: ${uid}`);
  }
  if (Object.keys(remoteUsers).length === 0) {
    console.log("No remote users currently connected.");
  }
}