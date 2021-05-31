import GoogleAssistant from "./GoogleAssistant";

const deviceCredentials = require("../devicecredentials.json");

const DEVICE_MODEL_ID = "test-speaker-9d9d7-speaker-cwfymv";
const DEVICE_INSTANCE_ID = "test-speaker-1";

const CREDENTIALS = {
  client_id: deviceCredentials.client_id,
  client_secret: deviceCredentials.client_secret,
  refresh_token: deviceCredentials.refresh_token,
  type: "authorized_user",
};

async function main() {
  const assistant = new GoogleAssistant(
    CREDENTIALS,
    DEVICE_MODEL_ID,
    DEVICE_INSTANCE_ID
  );

  // options
  assistant.playback = true;
  assistant.consoleOutput = true;
  assistant.dynamicMonitor = true;

  // start testing
  try {
    const res1 = await assistant.sendAudio("wav/TalkToSony'sTv.wav");
    console.dir(res1);
    if (!res1.isMicOpen) {
      return;
    }

    const res2 = await assistant.sendAudio("wav/TurnOnTv.wav");
    console.dir(res2);
  } catch (err) {
    console.error(err);
  }
}

main();
