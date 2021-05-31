import chalk from "chalk";
import { SpeechResult } from "./AssistApiConnection";
import { writeOnSameLine } from "./ConsoleUtils";

export default class AssistantMonitor {
  userTag = chalk.bgGreen(" User > ");
  assistantTag = chalk.bgBlue(" Assistant > ");
  dynamicUpdate = true;
  confirmed = true;
  threshold = 0.6;
  #update: ((text: string) => void) | null = null;
  #latestRecognition: Array<SpeechResult> | null = null;

  updateUserRecognition(results: Array<SpeechResult>) {
    if (this.confirmed) {
      this._startRecognition();
    }

    this.#latestRecognition = results;
    const text = `${this.userTag} ${this._speechResultsToText(results)}`;
    this.#update?.(text);
  }

  confirmRecognition() {
    this.confirmed = true;
    if (!this.dynamicUpdate && this.#latestRecognition) {
      const text = `${this.userTag} ${this._speechResultsToText(
        this.#latestRecognition
      )}`;
      console.log(text);
    }
  }

  putAssistantResponse(text: string) {
    this.confirmRecognition();
    console.log(`${this.assistantTag} ${chalk.blue(text)}`);
  }

  _startRecognition() {
    this.confirmed = false;

    if (this.dynamicUpdate) {
      this.#update = writeOnSameLine(`${this.userTag} `, 1);
    }
  }

  _speechResultsToText(results: Array<SpeechResult>): string {
    return chalk.green(
      results
        .map((result) =>
          result.stability < this.threshold
            ? chalk.underline(result.transcript)
            : result.transcript
        )
        .join("")
    );
  }
}
