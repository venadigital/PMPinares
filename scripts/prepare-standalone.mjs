import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const standaloneDir = join(root, ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("Standalone output not found. Skipping asset copy.");
  process.exit(0);
}

const publicDir = join(root, "public");
const standalonePublicDir = join(standaloneDir, "public");
const staticDir = join(root, ".next", "static");
const standaloneStaticDir = join(standaloneDir, ".next", "static");

if (existsSync(publicDir)) {
  rmSync(standalonePublicDir, { recursive: true, force: true });
  cpSync(publicDir, standalonePublicDir, { recursive: true });
}

if (existsSync(staticDir)) {
  mkdirSync(join(standaloneDir, ".next"), { recursive: true });
  rmSync(standaloneStaticDir, { recursive: true, force: true });
  cpSync(staticDir, standaloneStaticDir, { recursive: true });
}

writeFileSync(
  join(root, ".next", "server.js"),
  [
    "process.env.NODE_ENV = process.env.NODE_ENV || 'production';",
    "process.env.HOSTNAME = '0.0.0.0';",
    "require('./standalone/server.js');",
    ""
  ].join("\n")
);

console.log("Standalone assets ready.");
