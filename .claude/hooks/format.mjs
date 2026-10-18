// PostToolUse hook: format (and lint-fix) the file Claude just edited.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const file = input.tool_input?.file_path;
if (!file || !existsSync(file) || file.includes("node_modules")) process.exit(0);

const run = (cmd, args) => {
  try {
    execFileSync(cmd, args, { stdio: "ignore" });
  } catch {
    // Never block the edit; `npm run check` reports anything left.
  }
};

if (/\.(tsx?|mts|js|mjs|json|css|md|ya?ml)$/.test(file)) {
  run("npx", ["prettier", "--write", "--ignore-unknown", file]);
}
if (/\.(tsx?|mts)$/.test(file)) {
  run("npx", ["eslint", "--fix", file]);
}
