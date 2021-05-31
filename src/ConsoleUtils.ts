import readline from "readline";

export function writeOnSameLine(text: string, count: number) {
  console.log(text);
  return (text: string) => {
    showCursor(false);
    readline.moveCursor(process.stdout, 0, -count);
    readline.clearLine(process.stdout, 0);
    console.log(text);
    showCursor(true);
  };
}

export function showCursor(on: boolean) {
  const c = on ? "\x1B[?25h" : "\x1B[?25l";
  process.stdout.write(c);
}
