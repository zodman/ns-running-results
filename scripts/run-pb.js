import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const isWin = process.platform === "win32";
const exeName = isWin ? "pocketbase.exe" : "pocketbase";
const pbPath = path.join(process.cwd(), "pocketbase", exeName);

if (!fs.existsSync(pbPath)) {
  console.error(`[pocketbase] Error: Binary not found at ${pbPath}`);
  process.exit(1);
}

const child = spawn(pbPath, ["serve", "--http=127.0.0.1:8090"], {
  stdio: "inherit"
});

child.on("error", (err) => {
  console.error(`[pocketbase] Failed to start: ${err.message}`);
  process.exit(1);
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

// Forward termination signals to child process
const handleSignal = (sig) => {
  try {
    child.kill(sig);
  } catch (_) {}
  process.exit(0);
};

process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));
