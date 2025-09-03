console.log("Hello, Repository Inspector!");

// Minimal ANSI helpers for console.log (Node.js)
// All comments are in technical and formal English.

const enum SGR {
  Reset = "\x1b[0m",
  Bold = "\x1b[1m",
  Dim = "\x1b[2m",
  Italic = "\x1b[3m",
  Underline = "\x1b[4m",

  // 16-color foregrounds
  Red = "\x1b[31m",
  Green = "\x1b[32m",
  Yellow = "\x1b[33m",
  Blue = "\x1b[34m",
  Magenta = "\x1b[35m",
  Cyan = "\x1b[36m",
  White = "\x1b[37m",
  Gray = "\x1b[90m",
}

function supportsColor(): boolean {
  // Respect NO_COLOR; avoid color when stdout is not a TTY.
  if (!process.stdout.isTTY) return false;
  if (process.env.NO_COLOR) return false;
  // FORCE_COLOR enables color even in some atypical environments.
  if (process.env.FORCE_COLOR) return true;
  return true;
}

function colorize(text: string, ...codes: string[]): string {
  if (!supportsColor()) return text;
  return codes.join("") + text + SGR.Reset;
}

// Usage examples with console.log
console.log(colorize("[INFO] ", SGR.Cyan, SGR.Bold) + "Repository Inspector started.");
console.log(colorize("[WARN] ", SGR.Yellow) + "Large repositories may take longer.");
console.error(colorize("[ERROR] ", SGR.Red, SGR.Bold) + "Unexpected failure.");
console.log(colorize("[OK] ", SGR.Green) + "Done.");
