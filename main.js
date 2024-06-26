const APP_ID = "a39c70c4d8974c89ad56a89655a1dbf1";
const TOKEN =
  "007eJxTYGhf41egw5Bh37uhoPDcbudlX6dm69Q/cJs/+aD0v+61hQ8VGBKNLZPNDZJNUiwszU2SLSwTU0zNEi0szUxNEw1TktIMn7rLpDUEMjKEX/nDwAiFID4LQ4hrcAgDAwCUjSCF";
const CHANNEL = "TEST";
let cameraIsOn;
let micIsOn;

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
  client.on("user-published", handleUserJoined);

  client.on("user-left", handleUserLeft);

  let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`;
  document
    .getElementById("video-streams")
    .insertAdjacentHTML("beforeend", player);

  localTracks[1].play(`user-${UID}`);

  await client.publish([localTracks[0], localTracks[1]]);
  checkCam();
  checkMic();
};

let joinStream = async () => {
  await joinAndDisplayLocalStream();

};

let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) {
      player.remove();
    }

    player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`;
    document
      .getElementById("video-streams")
      .insertAdjacentHTML("beforeend", player);

    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
  for (let i = 0; localTracks.length > i; i++) {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.leave();
};

let toggleMic = async (e) => {
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    checkMic();
  } else {
    await localTracks[0].setMuted(true);
    checkMic();
  }
};

let toggleCamera = async (e) => {
  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    checkCam();
  } else {
    await localTracks[1].setMuted(true);
    checkCam();
  }
};

let checkMic = () => {
  if (localTracks.length > 0 && localTracks[0]) {
    // Check if the microphone track is available
    micIsOn = !localTracks[0].muted; // `micIsOn` is true if the mic is not muted
    console.log("Microphone is on:", micIsOn);
    bubble_fn_Mic(micIsOn);
  } else {
    console.log("Microphone track is not available.");
    bubble_fn_Mic(micIsOn);
  }
};

let checkCam = () => {
  if (localTracks.length > 0 && localTracks[1]) {
    // Assuming localTracks[1] is the camera track.
    // Additional checks might be needed to accurately determine if the camera is "on".
    // Check if the camera track is not muted and is enabled/active if those properties are available.
    cameraIsOn = !localTracks[1].muted; // This assumes 'muted' means the camera is not sending any video.
    console.log("Camera is on:", cameraIsOn);
    bubble_fn_Cam(cameraIsOn);
  } else {
    cameraIsOn = false; // Camera track is not available
    console.log("Camera is not available.");
    bubble_fn_Cam(cameraIsOn);
  }
};
