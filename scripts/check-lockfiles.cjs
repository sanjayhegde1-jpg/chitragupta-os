const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const allowedLockfile = path.join(repoRoot, "package-lock.json");
const forbiddenNames = new Set(["yarn.lock", "pnpm-lock.yaml", "package-lock.json"]);

const offenders = [];

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!forbiddenNames.has(entry.name)) {
      continue;
    }
    if (entry.name === "package-lock.json" && fullPath === allowedLockfile) {
      continue;
    }
    offenders.push(fullPath);
  }
};

walk(repoRoot);

if (offenders.length > 0) {
  console.error("[lockfiles] Forbidden lockfiles detected:");
  for (const file of offenders) {
    console.error(`- ${path.relative(repoRoot, file)}`);
  }
  process.exit(1);
}

console.log("[lockfiles] OK: only root package-lock.json present.");
