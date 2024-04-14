// Define global variables for Agora client and local streams
let client;
let remoteUsers = {};
let localTracks = {
  videoTrack: null,
  audioTrack: null,
};

// Configuration for your Agora client - replace with your own App ID
const AGORA_APP_ID = "a39c70c4d8974c89ad56a89655a1dbf1";


// Function to start the basic live streaming
async function startBasicLiveStreaming(channelName, token) {
  // Initialize the Agora client in RTC mode with VP8 codec
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(AGORA_APP_ID, channelName, token, null);

  // Create and publish local video and audio tracks
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

  // Setup the local video stream container
  const localVideoDiv = createVideoContainer("local-stream");
  document.getElementById("box").appendChild(localVideoDiv);
  localTracks.videoTrack.play(`video-local-stream`);

  // Publish the local tracks
  await client.publish(Object.values(localTracks));
  console.log("Publishing local streams");

  // Handle event streams for users
  setupStreamEventHandlers();

  // Manage existing users in the channel
  client.remoteUsers.forEach(async user => {
    await client.subscribe(user, "video");
    console.log("Subscribed to existing user:", user.uid);
    addVideoStream(user);
    if (user.audioTrack) {
      user.audioTrack.play(); // Handle audio playing accordingly
    }
  });
}

// Function to create a video container for the user
function createVideoContainer(uid) {
  const playerDiv = document.createElement("div");
  playerDiv.className = "video-container";
  playerDiv.id = `video-container-${uid}`;

  const videoElement = document.createElement("div");
  videoElement.id = `video-${uid}`;
  playerDiv.appendChild(videoElement);

  return playerDiv;
}

// Function to set up stream event handlers
function setupStreamEventHandlers() {
  client.on("user-published", async (user, mediaType) => {
    // Subscribe to the newly published stream
    await client.subscribe(user, mediaType);
    console.log("Subscribed to user:", user.uid);

    if (mediaType === "video") {
      addVideoStream(user);
    }

    if (mediaType === "audio") {
      user.audioTrack.play(); // Handle audio playing accordingly
    }
  });

  client.on("user-unpublished", user => {
    console.log(`User unpublished ${user.uid}`);
    removeVideoStream(user.uid);
  });

  client.on("user-left", user => {
    console.log(`User left ${user.uid}`);
    removeVideoStream(user.uid);
  });
}

// Function to add video stream to the UI
function addVideoStream(user) {
  const box = document.getElementById("box");
  const videoDivId = `video-${user.uid}`;
  if (!document.getElementById(videoDivId)) {
    const playerDiv = createVideoContainer(user.uid);
    box.appendChild(playerDiv);
    if (user.videoTrack) {
      user.videoTrack.play(videoDivId);
    }
  }
}

// Function to remove video stream from the UI
function removeVideoStream(uid) {
  const videoContainer = document.getElementById(`video-container-${uid}`);
  if (videoContainer) {
    videoContainer.parentNode.removeChild(videoContainer);
  }
}
