/**
 * Build public/data/rockyou.txt from the full rockyou.txt wordlist.
 *
 * Usage:
 *   node scripts/build-rockyou-data.mjs [path/to/rockyou.txt]
 *
 * Default input: ./rockyou.txt (place the full leak file at repo root, gitignored).
 * Output: public/data/rockyou.txt (lowercase, deduped, one password per line).
 */
import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const inputPath = path.resolve(root, process.argv[2] ?? "rockyou.txt");
const outputPath = path.resolve(root, "public", "data", "rockyou.txt");

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  console.error("Download rockyou.txt and place it at the repo root, then rerun.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const seen = new Set();
const output = fs.createWriteStream(outputPath, { encoding: "utf8" });
const input = fs.createReadStream(inputPath, { encoding: "utf8" });
const rl = readline.createInterface({ input, crlfDelay: Infinity });

let lines = 0;
let written = 0;

for await (const line of rl) {
  lines += 1;
  const password = line.trim().toLowerCase();
  if (!password || seen.has(password)) continue;
  seen.add(password);
  output.write(`${password}\n`);
  written += 1;
}

output.end();

console.log(`Processed ${lines.toLocaleString()} lines → ${written.toLocaleString()} unique passwords`);
console.log(`Wrote ${outputPath}`);
