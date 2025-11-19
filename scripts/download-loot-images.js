import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, basename } from "node:path";

const lootPath = join(process.cwd(), "src/data/loot.json");
const outputDir = join(process.cwd(), "public/assets/loot");

mkdirSync(outputDir, { recursive: true });

const loot = JSON.parse(readFileSync(lootPath, "utf8"));
const imageUrls = Array.from(
  new Set(loot.map((entry) => entry.image).filter(Boolean))
);

async function download(url) {
  const filename = basename(new URL(url).pathname);
  const destination = join(outputDir, filename);

  if (existsSync(destination)) {
    console.log(`Skipping already downloaded ${filename}`);
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destination, buffer);
  console.log(`Downloaded ${filename}`);
}

async function main() {
  for (const url of imageUrls) {
    await download(url);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
