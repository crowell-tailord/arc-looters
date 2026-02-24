import { readFileSync, writeFileSync } from "node:fs";
import { join, basename } from "node:path";

const lootPath = join(process.cwd(), "src/data/loot.json");
const loot = JSON.parse(readFileSync(lootPath, "utf8"));

const updatedLoot = loot.map((entry) => {
  const updatedEntry = { ...entry };

  if (entry.image) {
    updatedEntry.localImage = decodeURIComponent(
      basename(new URL(entry.image).pathname)
    );
  }

  return updatedEntry;
});

writeFileSync(lootPath, JSON.stringify(updatedLoot, null, 2) + "\n");
console.log("Updated loot.json with localImage properties");
