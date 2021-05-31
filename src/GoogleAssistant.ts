import { Response } from "./Response";
import Speaker from "speaker";
import {
  AssistApiConnection,
  Credentials,
  SpeechResult,
} from "./AssistApiConnection";
import AudioFileStream from "./AudioFileStream";
import AssistantMonitor from "./RecognitionMonitor";

const wav = require("wav");

export default class GoogleAssistant {
  locale: string;
  deviceModelId: string;
  deviceInstanceId: string;
  /** If enabled, input audio and reply voice will be played back. */
  playback = true;
  /** If enabled, speech texts are displayed on the console. */
  consoleOutput = true;
  /** If enabled, speech recognition status are dynamically updated on the console. */
  dynamicMonitor = true;

  #connection: AssistApiConnection;
  #conversationState: any = null;

  constructor(
    credentials: Credentials,
    deviceModelId: string,
    deviceInstanceId: string,
    locale = "en-US"
  ) {
    this.#connection = new AssistApiConnection(credentials);
    this.deviceModelId = deviceModelId;
    this.deviceInstanceId = deviceInstanceId;
    this.locale = locale;
  }

  resetConversationalState(): void {
    this.#conversationState = null;
  }

  /**
   * Send text to Assistant.
   * @param input input text.
   * @returns response from Assistant.
   */
  async sendText(input: string): Promise<Response> {
    return this._send(input, null);
  }

  /**
   * Send WAV audio file to Assistant.
   * @param filePath WAV file path.
   * @returns response from Assistant.
   */
  async sendAudio(filePath: string): Promise<Response> {
    return this._send(null, filePath);
  }

  async _send(
    text: string | null,
    audioFilePath: string | null
  ): Promise<Response> {
    const outputStream = new wav.FileWriter("./test.wav", {
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
    });
    const audioFileStream =
      audioFilePath !== null
        ? new AudioFileStream(audioFilePath, 3200, 2, 16000)
        : null;

    const speaker = this.playback
      ? new Speaker({
          sampleRate: 16000,
          channels: 1,
          bitDepth: 16,
        })
      : null;

    const assistantMonitor = this.consoleOutput ? new AssistantMonitor() : null;
    if (assistantMonitor) {
      assistantMonitor.dynamicUpdate = this.dynamicMonitor;
      if (text) {
        assistantMonitor.updateUserRecognition([
          { transcript: text, stability: 1 },
        ]);
      }
    }

    const call = this.#connection.assistWithConfig(
      this.locale,
      this.deviceInstanceId,
      this.deviceModelId,
      text,
      this.#conversationState
    );

    audioFileStream?.stream(
      (data) => {
        speaker?.write(data);
        this.#connection.sendAudio(data);
      },
      () => {}
    );

    return new Promise((resolve, reject) => {
      const response = new Response("", null, true);
      let isAudioResponseStarted = false;

      call.on("data", (data: any) => {
        if (data.event_type === "END_OF_UTTERANCE") {
          audioFileStream?.stopStreaming();
        }

        if (
          assistantMonitor &&
          data.speech_results &&
          data.speech_results.length > 0
        ) {
          const recog = data.speech_results as Array<SpeechResult>;
          assistantMonitor?.updateUserRecognition(recog);
          response.speechResults = recog;
        }

        if (data.device_action) {
          response.deviceAction = JSON.parse(
            data.device_action.device_request_json
          );
        } else if (
          data.dialog_state_out !== null &&
          data.dialog_state_out.supplemental_display_text
        ) {
          response.text = data.dialog_state_out.supplemental_display_text;
          assistantMonitor?.putAssistantResponse(response.text);
        }

        if (data.audio_out && data.audio_out.audio_data) {
          audioFileStream?.stopStreaming();
          outputStream.write(data.audio_out.audio_data);
          if (speaker !== null) {
            speaker?.write(data.audio_out.audio_data);
            if (!isAudioResponseStarted) {
              isAudioResponseStarted = true;
              this._onSpeakerEnded(speaker, () => {
                call.end();
                resolve(response);
                isAudioResponseStarted = false;
              });
            }
          }
        }

        if (data.dialog_state_out?.conversation_state) {
          this.#conversationState = data.dialog_state_out.conversation_state;
        }

        if (data.dialog_state_out?.microphone_mode === "DIALOG_FOLLOW_ON") {
          response.isMicOpen = true;

          if (!speaker) {
            call.end();
            resolve(response);
          }
        } else if (
          data.dialog_state_out?.microphone_mode === "CLOSE_MICROPHONE"
        ) {
          response.isMicOpen = false;

          if (!speaker) {
            call.end();
            resolve(response);
          }
        }
      });

      call.on("error", (error: any) => {
        reject(error);
      });
    });
  }

  /**
   * Set callback to wait until audio playback is ended
   * @param speaker Speaker instance.
   * @param onEnded callback.
   */
  _onSpeakerEnded(speaker: Speaker, onEnded: () => void) {
    const handle = setInterval(() => {
      if (speaker.writableLength === 0) {
        clearInterval(handle);
        setTimeout(onEnded, 1000);
      }
    }, 100);
  }
}
