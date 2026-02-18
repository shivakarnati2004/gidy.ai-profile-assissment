import { createServer } from "node:net";
import { spawn } from "node:child_process";
import path from "node:path";

const frontendPorts = [8080, 8082, 5173];

const isPortFree = (port) =>
  new Promise((resolve) => {
    const tester = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "0.0.0.0");
  });

const tryStartVite = (port) =>
  new Promise((resolve) => {
    const viteBin = path.resolve(process.cwd(), "node_modules", "vite", "bin", "vite.js");
    const child = spawn(
      process.execPath,
      [viteBin, "--host", "--port", String(port), "--strictPort"],
      { stdio: "inherit", shell: false }
    );

    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ ok: true, child });
      }
    }, 1200);

    child.on("exit", (code) => {
      if (!resolved) {
        clearTimeout(timer);
        resolved = true;
        resolve({ ok: code === 0, child, code });
      }
    });
  });

let started = false;

for (const port of frontendPorts) {
  if (!(await isPortFree(port))) {
    continue;
  }

  console.log(`Starting frontend on port ${port}...`);
  const result = await tryStartVite(port);

  if (result.ok) {
    started = true;
    result.child.on("exit", (code) => {
      process.exit(code ?? 0);
    });
    process.stdin.resume();
    process.on("SIGINT", () => {
      if (!result.child.killed) {
        result.child.kill();
      }
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      if (!result.child.killed) {
        result.child.kill();
      }
      process.exit(0);
    });
    break;
  }
}

if (!started) {
  console.error(`No usable frontend ports found. Tried: ${frontendPorts.join(", ")}`);
  process.exit(1);
}
