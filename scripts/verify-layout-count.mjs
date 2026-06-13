import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const layoutsDir = path.join(projectRoot, "src", "layouts");

function walkRegisterFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walkRegisterFiles(fullPath);
    return entry.name === "register.ts" ? [fullPath] : [];
  });
}

/**
 * Collect unique layout IDs registered in a single register.ts source string.
 * Handles both:
 *   layoutRegistry.register("id", Component)
 *   layoutRegistry.registerBatch({ "id": Component, ... }, ...)
 */
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

/**
 * Count registration call-sites in a single register.ts source string —
 * mirrors the approach in src/layouts/layout-render.test.tsx:151-171 so that
 * expectedCount is always derived from the source of truth rather than a
 * hardcoded literal.
 *
 * Singles:  one `layoutRegistry.register(` call = 1 ID
 * Batches:  each string key inside a `registerBatch` block = 1 ID
 */
function countRegistrationCalls(source) {
  const singles = (source.match(/layoutRegistry\.register\(/g) ?? []).length;
  const batchKeys = (source.match(/^\s+"[\w-]+":/gm) ?? []).length;
  return singles + batchKeys;
}

const ids = new Set();
let expectedCount = 0;

for (const file of walkRegisterFiles(layoutsDir)) {
  const source = fs.readFileSync(file, "utf8");
  for (const id of collectLayoutIds(source)) {
    ids.add(id);
  }
  expectedCount += countRegistrationCalls(source);
}

if (ids.size !== expectedCount) {
  console.error(`Expected ${expectedCount} registered layouts (from source scan), found ${ids.size} unique IDs.`);
  if (ids.size < expectedCount) {
    console.error("Possible duplicate layout ID registrations — check register.ts files.");
  }
  console.error([...ids].sort().join("\n"));
  process.exit(1);
}

console.log(`Verified ${ids.size} registered layouts.`);
