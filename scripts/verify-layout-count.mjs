import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const layoutsDir = path.join(projectRoot, "src", "layouts");
const expectedCount = 39;

function walkRegisterFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkRegisterFiles(fullPath);
    return entry.name === "register.ts" ? [fullPath] : [];
  });
}

function collectLayoutIds(source) {
  const ids = new Set();

  for (const match of source.matchAll(/layoutRegistry\.register\(\s*["']([^"']+)["']/g)) {
    ids.add(match[1]);
  }

  for (const match of source.matchAll(/layoutRegistry\.registerBatch\(\s*{([\s\S]*?)}\s*,/g)) {
    for (const keyMatch of match[1].matchAll(/["']([^"']+)["']\s*:/g)) {
      ids.add(keyMatch[1]);
    }
  }

  return ids;
}

const ids = new Set();
for (const file of walkRegisterFiles(layoutsDir)) {
  const source = fs.readFileSync(file, "utf8");
  for (const id of collectLayoutIds(source)) {
    ids.add(id);
  }
}

if (ids.size !== expectedCount) {
  console.error(`Expected ${expectedCount} registered layouts, found ${ids.size}.`);
  console.error([...ids].sort().join("\n"));
  process.exit(1);
}

console.log(`Verified ${ids.size} registered layouts.`);
