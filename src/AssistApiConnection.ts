import path from "path";
import { Writable } from "stream";
import grpc, { GoogleOAuth2Client } from "grpc";
import * as protoFiles from "google-proto-files";
import { UserRefreshClient } from "google-auth-library";

const PROTO_ROOT_DIR = protoFiles.getProtoPath("..");
const grpcObj = grpc.load({
  root: PROTO_ROOT_DIR,
  file: path.relative(PROTO_ROOT_DIR, protoFiles["embeddedAssistant"].v1alpha2),
});
const embeddedAssistantPb = (grpcObj as any).google.assistant.embedded.v1alpha2;

export interface Credentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
  type: string;
}

export interface SpeechResult {
  transcript: string;
  stability: number;
}

export class AssistApiConnection {
  static endpoint = "embeddedassistant.googleapis.com";
  #client: any;
  #callObject: Writable | null = null;

  constructor(credentials: Credentials) {
    this.#client = this.createClient(credentials);
  }

  private createClient(credentials: Credentials) {
    const sslCreds = grpc.credentials.createSsl();
    // https://github.com/google/google-auth-library-nodejs/blob/master/ts/lib/auth/refreshclient.ts
    const refresh = new UserRefreshClient();
    refresh.fromJSON(credentials);
    const callCreds = grpc.credentials.createFromGoogleCredential(
      refresh as unknown as GoogleOAuth2Client
    );
    const combinedCreds = grpc.credentials.combineChannelCredentials(
      sslCreds,
      callCreds
    );
    const client = new embeddedAssistantPb.EmbeddedAssistant(
      AssistApiConnection.endpoint,
      combinedCreds
    );
    return client;
  }

  assistWithConfig(
    locale: string,
    deviceInstanceId: string,
    deviceModelId: string,
    input: string | null,
    conversationState: any = null
  ): Writable {
    const config = new embeddedAssistantPb.AssistConfig();
    if (input !== null) config.setTextQuery(input);

    config.setAudioOutConfig(new embeddedAssistantPb.AudioOutConfig());
    config.getAudioOutConfig().setEncoding(1);
    config.getAudioOutConfig().setSampleRateHertz(16000);
    config.getAudioOutConfig().setVolumePercentage(100);
    config.setDialogStateIn(new embeddedAssistantPb.DialogStateIn());
    config.setDeviceConfig(new embeddedAssistantPb.DeviceConfig());
    config.getDialogStateIn().setLanguageCode(locale);
    if (conversationState) {
      config.getDialogStateIn().setConversationState(conversationState);
    }
    config.getDeviceConfig().setDeviceId(deviceInstanceId);
    config.getDeviceConfig().setDeviceModelId(deviceModelId);

    const audioInConfig = new embeddedAssistantPb.AudioInConfig();
    audioInConfig.setEncoding(
      embeddedAssistantPb.AudioInConfig.Encoding.LINEAR16
    );
    audioInConfig.setSampleRateHertz(16000);
    config.setAudioInConfig(audioInConfig);
    const request = new embeddedAssistantPb.AssistRequest();
    request.setConfig(config);

    delete request.audio_in;

    const call = this.#client.assist() as Writable;
    call.write(request);
    this.#callObject = call;

    return call;
  }

  sendAudio(uint8Array: Uint8Array) {
    if (!this.#callObject) {
      throw new Error("Call assistWithConfig() first");
    }

    const request = new embeddedAssistantPb.AssistRequest();
    request.audio_in = uint8Array;
    this.#callObject?.write(request);
  }

  end() {
    this.#callObject?.end();
    this.#callObject = null;
  }
}
