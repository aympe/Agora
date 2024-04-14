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
  // Initialize the Agora client in RTC mode with VP8 codec
  client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  await client.join(AGORA_APP_ID, channelName, token, null);

  // Create and publish local video and audio tracks
  localTracks.videoTrack = await AgoraRTC.createCameraVideoTrack();
  localTracks.audioTrack = await AgoraRTC.createMicrophoneAudioTrack();

  // Setup the local video stream container
  const box = document.getElementById("box");
  const localVideoDiv = createVideoContainer("local-stream");
  box.appendChild(localVideoDiv);
  localTracks.videoTrack.play(`video-local-stream`);

  // Publish the local tracks
  await client.publish(Object.values(localTracks));
  console.log("Publishing local streams");

  // Event handling for new and existing user streams
  setupStreamEventHandlers();
}

function createVideoContainer(uid) {
  const playerDiv = document.createElement("div");
  playerDiv.className = "video-container";
  playerDiv.id = `video-container-${uid}`;

  const videoElement = document.createElement("div");
  videoElement.id = `video-${uid}`;
  playerDiv.appendChild(videoElement);

  return playerDiv;
}

function setupStreamEventHandlers() {
  client.on("user-published", async (user, mediaType) => {
    // Subscribe to the newly published stream
    await client.subscribe(user, mediaType);
    console.log("Subscribed to user:", user.uid);

    if (mediaType === "video") {
      addVideoStream(user.uid);
    }

    if (mediaType === "audio") {
      user.audioTrack.play(); // Handle audio playing accordingly
    }
  });

  client.on("user-unpublished", (user) => {
    console.log(`User unpublished ${user.uid}`);
    removeVideoStream(user.uid);
  });

  client.on("user-left", (user) => {
    console.log(`User left ${user.uid}`);
    removeVideoStream(user.uid);
  });
}

function addVideoStream(uid) {
  const box = document.getElementById("box");
  const videoDivId = `video-${uid}`;
  if (!document.getElementById(videoDivId)) {
    const playerDiv = createVideoContainer(uid);
    box.appendChild(playerDiv);
    const user = client.remoteUsers.find((user) => user.uid === uid);
    if (user && user.hasVideo) {
      user.videoTrack.play(videoDivId);
    }
  }
}

function removeVideoStream(uid) {
  const videoContainer = document.getElementById(`video-container-${uid}`);
  if (videoContainer) {
    videoContainer.parentNode.removeChild(videoContainer);
  }
}