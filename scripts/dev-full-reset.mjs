import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { spawn } from "node:child_process";

const execFileAsync = promisify(execFile);
const portsToFree = [4000, 8082];

const killWindowsPortOwners = async (ports) => {
  const uniquePids = new Set();

  for (const port of ports) {
    try {
      const { stdout } = await execFileAsync("powershell", [
        "-NoProfile",
        "-Command",
        `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess`
      ]);

      const pids = stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => Number(line))
        .filter((pid) => Number.isInteger(pid) && pid > 0);

      for (const pid of pids) {
        uniquePids.add(pid);
      }
    } catch {
      // Ignore per-port lookup failures and continue.
    }
  }

  for (const pid of uniquePids) {
    try {
      await execFileAsync("taskkill", ["/PID", String(pid), "/F"]);
      console.log(`Stopped process ${pid}.`);
    } catch {
      // Process may have already exited.
    }
  }
};

const run = async () => {
  if (process.platform === "win32") {
    console.log("Freeing ports 4000 and 8082...");
    await killWindowsPortOwners(portsToFree);
  } else {
    console.log("Port reset is only implemented for Windows. Starting fixed localhost mode directly...");
  }

  const npmCli = process.env.npm_execpath;
  const child = npmCli
    ? spawn(process.execPath, [npmCli, "run", "dev:full"], {
        stdio: "inherit",
        shell: false
      })
    : spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev:full"], {
        stdio: "inherit",
        shell: false
      });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
