import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * check-doc-facts.mjs — doc-fact-check for prose that states derivable facts.
 *
 * Companion to verify-layout-count.mjs (which guards the registry itself).
 * This script guards the DOCS: every checked claim is derived from code at
 * run time and compared against what the prose says, so counts, cited file
 * paths, and registry labels cannot silently drift (the 2026-07-06 audit
 * found a phantom `src/App.v14.tsx` citation and stale 15-theme / 8-pack
 * counts that no gate caught). Pattern documented at the portfolio root:
 * docs/conventions/doc-fact-check.md.
 *
 * Checks:
 *   1. Every src/, scripts/, or docs/ path cited in the doc surfaces exists.
 *   2. "<n> themes" / "<n> Theme objects"      == entries in src/tokens/themes.ts
 *   3. "<n> style modes"                        == entries in src/tokens/style-modes.ts
 *   4. "<n> content packs|decks"                == makeContentPack() calls in content-registry.ts
 *   5. "<n> registered layouts" / "<n> IDs across" == IDs in src/layouts/<family>/register.ts
 *   6. README "Content Decks" table labels      == labels registered in CONTENT_PACKS
 *   7. docs/DECK-SHAPE-SPEC.md `<deck id label>` tags == labels registered in CONTENT_PACKS
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

// NOTE: CLAUDE.md deliberately excluded — it's gitignored ("Local AI /
// assistant config, not part of the published project") and absent from a
// fresh checkout, so referencing it here would fail check:docs in CI for
// everyone (it only "works" locally by the accident of the ignored file
// still sitting on disk). Its cited paths/counts were hand-verified instead
// (see the doc-drift sweep notes) but cannot be mechanically guarded while
// the file stays untracked.
const DOC_SURFACES = [
  "README.md",
  "docs/ARCHITECTURE.md",
  "docs/DOCUMENTATION-REVIEW.md",
  "docs/DECK-SHAPE-SPEC.md",
];

// Cited paths that intentionally do not exist on disk. Each entry documents
// WHY it is exempt — additions to this list should be rare and justified.
const PATH_ALLOWLIST = [
  /my-deck|my-family|MyFamilyLayout/, // tutorial placeholders in the "add a deck/family" walkthroughs
  /^src\/patterns\/decks\/index\.ts$/, // DEBT-002 resolution cites this barrel AS deleted
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function readRepoFile(relPath) {
  // Normalize CRLF so section/line regexes behave identically on every checkout.
  return fs.readFileSync(path.join(projectRoot, relPath), "utf8").replace(/\r\n/g, "\n");
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}

// ── Derived values (the source of truth, computed fresh every run) ──────────

function countTokenEntries(relPath) {
  // Data entries in themes.ts / style-modes.ts are the only `id: "..."` lines;
  // interface fields are typed (`id: ThemeId`) and font-URL records are keyed
  // by bare string, so neither matches.
  const source = readRepoFile(relPath);
  return (source.match(/^\s*id: "/gm) ?? []).length;
}

function collectContentPacks() {
  const source = readRepoFile("src/content/content-registry.ts");
  const packs = new Map();
  for (const match of source.matchAll(/makeContentPack\(\s*"([^"]+)",\s*"([^"]+)"/g)) {
    packs.set(match[1], match[2]);
  }
  return packs;
}

function collectLayoutIds() {
  // Mirrors scripts/verify-layout-count.mjs — derived from register.ts sources.
  const layoutsDir = path.join(projectRoot, "src", "layouts");
  const registerFiles = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name === "register.ts") registerFiles.push(fullPath);
    }
  })(layoutsDir);

  const ids = new Set();
  for (const file of registerFiles) {
    const source = fs.readFileSync(file, "utf8");
    for (const match of source.matchAll(/layoutRegistry\.register\(\s*["']([^"']+)["']/g)) {
      ids.add(match[1]);
    }
    for (const batch of source.matchAll(/layoutRegistry\.registerBatch\(\s*{([\s\S]*?)}\s*,/g)) {
      for (const keyMatch of batch[1].matchAll(/["']([^"']+)["']\s*:/g)) {
        ids.add(keyMatch[1]);
      }
    }
  }
  return ids;
}

// ── Checks ───────────────────────────────────────────────────────────────────

function checkCitedPathsExist(surface, source) {
  const cited = new Set();
  for (const match of source.matchAll(/(?:src|scripts|docs)\/[A-Za-z0-9_./-]+\.[a-z]+/g)) {
    cited.add(JSON.stringify([match[0], lineOf(source, match.index)]));
  }
  for (const entry of cited) {
    const [relPath, line] = JSON.parse(entry);
    if (PATH_ALLOWLIST.some((pattern) => pattern.test(relPath))) continue;
    if (!fs.existsSync(path.join(projectRoot, relPath))) {
      fail(`${surface}:${line}: cites "${relPath}" which does not exist on disk`);
    }
  }
}

function checkCountClaims(surface, source, patterns, derived, factName) {
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const claimed = Number(match[1]);
      if (claimed !== derived) {
        fail(
          `${surface}:${lineOf(source, match.index)}: says ${claimed} ${factName}, code derives ${derived} ("${match[0]}")`,
        );
      }
    }
  }
}

function checkReadmeDeckLabels(packs) {
  const source = readRepoFile("README.md");
  const sectionMatch = source.match(/## Content Decks\n([\s\S]*?)(?:\n## |$)/);
  if (!sectionMatch) {
    fail("README.md: could not locate the 'Content Decks' section to check labels");
    return;
  }
  for (const row of sectionMatch[1].matchAll(/^\|\s*`([a-z-]+)`\s*\|\s*([^|]+?)\s*\|/gm)) {
    const [, deckKey, label] = row;
    if (!packs.has(deckKey)) {
      fail(`README.md Content Decks table lists "${deckKey}" which is not registered in CONTENT_PACKS`);
      continue;
    }
    const registered = packs.get(deckKey);
    if (registered !== label) {
      fail(`README.md Content Decks table labels "${deckKey}" as "${label}"; content-registry.ts registers "${registered}"`);
    }
  }
}

function checkDeckShapeSpecLabels(packs) {
  const source = readRepoFile("docs/DECK-SHAPE-SPEC.md");
  const matches = [...source.matchAll(/<deck\s+id="([a-z-]+)"\s+label="([^"]+)"/g)];
  if (matches.length === 0) {
    fail("docs/DECK-SHAPE-SPEC.md: could not locate any '<deck id label>' tags to check");
    return;
  }
  for (const [, deckKey, label] of matches) {
    if (!packs.has(deckKey)) {
      fail(`docs/DECK-SHAPE-SPEC.md cites deck "${deckKey}" which is not registered in CONTENT_PACKS`);
      continue;
    }
    const registered = packs.get(deckKey);
    if (registered !== label) {
      fail(`docs/DECK-SHAPE-SPEC.md labels "${deckKey}" as "${label}"; content-registry.ts registers "${registered}"`);
    }
  }
}

// ── Run ──────────────────────────────────────────────────────────────────────

const themeCount = countTokenEntries("src/tokens/themes.ts");
const styleModeCount = countTokenEntries("src/tokens/style-modes.ts");
const packs = collectContentPacks();
const layoutIds = collectLayoutIds();

for (const surface of DOC_SURFACES) {
  const source = readRepoFile(surface);
  checkCitedPathsExist(surface, source);
  checkCountClaims(surface, source, [/(\d+)\s+(?:themes\b|Theme objects)/gi], themeCount, "themes");
  checkCountClaims(surface, source, [/(\d+)\s+style\s+modes/gi], styleModeCount, "style modes");
  checkCountClaims(
    surface,
    source,
    [/(\d+)\s+(?:migrated\s+|registered\s+)?content\s+(?:packs|decks)/gi],
    packs.size,
    "content packs",
  );
  checkCountClaims(
    surface,
    source,
    [/(\d+)\s+registered\s+layouts/gi, /(\d+)\s+IDs\s+across/gi],
    layoutIds.size,
    "registered layouts",
  );
}
checkReadmeDeckLabels(packs);
checkDeckShapeSpecLabels(packs);

if (failures.length > 0) {
  console.error(`Doc-fact check failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Doc-fact check passed: ${themeCount} themes, ${styleModeCount} style modes, ` +
    `${packs.size} content packs, ${layoutIds.size} layouts — all doc claims and cited paths verified.`,
);
