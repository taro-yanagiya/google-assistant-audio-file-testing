import fs from "fs";

const wav = require("wav");

export default class AudioFileStream {
  #streaming: boolean = false;
  #filePath: string;
  #chunkSize: number;
  #sampleWidth: number;
  #sampleRate: number;

  constructor(
    filePath: string,
    chunkSize: number,
    sampleWidth: number,
    sampleRate: number
  ) {
    this.#filePath = filePath;
    this.#chunkSize = chunkSize;
    this.#sampleWidth = sampleWidth;
    this.#sampleRate = sampleRate;
  }

  stream(onData: (data: Uint8Array) => void, onEnd: () => void) {
    const generate = () => {
      if (!this.#streaming) {
        onEnd();
        return;
      }

      const chunk = reader.read(this.#chunkSize);
      if (chunk) {
        onData(new Uint8Array(chunk));
      } else {
        onData(new Uint8Array(this.#chunkSize));
      }

      const missingDt = this._calcSleepTime();
      setTimeout(generate, missingDt > 0 ? missingDt : 0);
    };

    var file = fs.createReadStream(this.#filePath);
    const reader = new wav.Reader({
      sampleRate: 16000,
      channels: 1,
      bitDepth: 16,
    });
    file.pipe(reader);

    reader.on("format", (format: any) => {
      this.#streaming = true;
      generate();
    });
  }

  stopStreaming() {
    this.#streaming = false;
  }

  async _sleep(millis: number): Promise<void> {
    return new Promise((resolve, _) => {
      setTimeout(() => {
        resolve();
      }, millis);
    });
  }

  _calcSleepTime(): number {
    const sampleCount = this.#chunkSize / this.#sampleWidth;
    return (sampleCount / this.#sampleRate) * 1000;
  }

  alignBuf(array: Uint8Array) {
    return array;
  }

  normalizeAudioBuffer(buf: Buffer, volumePercentage: number) {
    if (this.#sampleWidth !== 2)
      throw new Error(`unsupported sample width: ${this.#sampleWidth}`);
    const scale = 2 ** ((1.0 * volumePercentage) / 100) - 1;
    return buf.map((e) => e * scale);
  }
}
