import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { request } from "node:http";

const backendPort = 4000;
const frontendPort = 8080;

const isPortFree = (port) =>
  new Promise((resolve) => {
    const tester = createServer()
      .once("error", () => resolve(false))
      .once("listening", () => {
        tester.close(() => resolve(true));
      })
      .listen(port, "0.0.0.0");
  });

const isBackendHealthy = () =>
  new Promise((resolve) => {
    const req = request(
      {
        hostname: "localhost",
        port: backendPort,
        path: "/api/health",
        method: "GET",
        timeout: 1200
      },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

const waitForBackend = async (attempts = 25, delayMs = 400) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await isBackendHealthy()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
};

const children = [];

const launch = (cmd, args) => {
  const child = spawn(cmd, args, { stdio: "inherit", shell: false });
  children.push(child);
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exit(code);
    }
  });
  return child;
};

const cleanExit = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
  process.exit(0);
};

process.on("SIGINT", cleanExit);
process.on("SIGTERM", cleanExit);

const backendHealthy = await isBackendHealthy();

if (backendHealthy) {
  console.log("Backend already running on port 4000.");
} else if (await isPortFree(backendPort)) {
  console.log("Starting backend on port 4000...");
  launch(process.platform === "win32" ? "npm.cmd" : "npm", ["--prefix", "server", "run", "dev"]);

  const ready = await waitForBackend();
  if (!ready) {
    console.error("Backend did not become healthy on port 4000.");
    process.exit(1);
  }
  console.log("Backend is healthy on port 4000.");
} else {
  console.error("Port 4000 is occupied and backend health check failed.");
  process.exit(1);
}

if (!(await isPortFree(frontendPort))) {
  console.error("Port 8080 is occupied. Free port 8080 for permanent localhost mode or use npm run dev:full:auto.");
  process.exit(1);
}

console.log("Starting frontend on fixed port 8080...");
launch(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev:frontend:8080"]);
