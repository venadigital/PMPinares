const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawn } = require("node:child_process");

const standaloneServer = join(__dirname, ".next", "standalone", "server.js");

if (existsSync(standaloneServer)) {
  require(standaloneServer);
} else {
  console.warn("Standalone server not found. Falling back to `next start`.");

  const nextBin = require.resolve("next/dist/bin/next");
  const child = spawn(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"], {
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: "inherit"
  });

  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}
