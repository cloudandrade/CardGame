/**
 * Roda o Next.js a partir do caminho canônico do repositório (git).
 * No Windows, cwd com casing diferente (cardgame vs CardGame) duplica React/Next no bundle.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));

function gitRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
    cwd: scriptDir,
  });
  if (result.status !== 0) {
    console.error("next-cli: não foi possível obter a raiz do git.");
    process.exit(result.status ?? 1);
  }
  return result.stdout.trim();
}

const root = gitRoot();
const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  console.error(`next-cli: Next não encontrado em ${root}. Rode yarn install na raiz do projeto.`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("next-cli: informe o comando (dev, build, start, …).");
  process.exit(1);
}

const child = spawnSync(process.execPath, [nextBin, ...args], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(child.status ?? 1);
