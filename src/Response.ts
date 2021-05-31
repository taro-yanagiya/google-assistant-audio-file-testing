import { SpeechResult } from "./AssistApiConnection";

export class Response {
  text: string;
  deviceAction: any;
  isMicOpen: boolean;
  speechResults: Array<SpeechResult> | null = null;

  constructor(text: string, deviceAction: any, isMicOpen: boolean) {
    this.text = text;
    this.deviceAction = deviceAction;
    this.isMicOpen = isMicOpen;
  }
}
