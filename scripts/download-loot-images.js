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
    return { status: "skipped", filename };
  }

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(`Request failed for ${url}: ${error.message}`);
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destination, buffer);
  console.log(`Downloaded ${filename}`);
  return { status: "downloaded", filename };
}

async function main() {
  const failures = [];

  for (const url of imageUrls) {
    try {
      await download(url);
    } catch (error) {
      failures.push({ url, error: error.message });
      console.error(error.message);
    }
  }

  if (failures.length) {
    console.error(`Failed to download ${failures.length} images:`);
    failures.forEach(({ url, error }) => console.error(` - ${url} (${error})`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
