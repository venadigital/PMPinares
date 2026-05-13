import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
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

console.log("Standalone assets ready.");
