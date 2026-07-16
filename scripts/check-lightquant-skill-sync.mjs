import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const manifestPath = path.join(root, "src", "server", "ai", "skills", "content", "lightquant-skill-sync-manifest.json");

function main() {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const sources = Array.isArray(manifest.sources) ? manifest.sources : [];
  const missing = [];
  const changed = [];
  const checked = [];

  for (const source of sources) {
    if (!source || typeof source.path !== "string" || typeof source.sha256 !== "string") {
      throw new Error("Invalid lightquant skill sync manifest source entry.");
    }

    if (!existsSync(source.path)) {
      missing.push(source.path);
      continue;
    }

    const currentSha256 = sha256File(source.path);
    checked.push(source.path);

    if (currentSha256 !== source.sha256) {
      changed.push({
        path: source.path,
        manifestSha256: source.sha256,
        currentSha256
      });
    }
  }

  if (changed.length > 0) {
    console.error("[lightquant-skill-sync] 本机 LightQuant Skill 已变化，网站领域规则可能需要重新同步：");
    for (const item of changed) {
      console.error(`- ${item.path}`);
      console.error(`  manifest: ${item.manifestSha256}`);
      console.error(`  current : ${item.currentSha256}`);
    }

    if (missing.length > 0) {
      printMissingNotice(missing);
    }

    process.exitCode = 1;
    return;
  }

  if (missing.length > 0) {
    printMissingNotice(missing);
    console.log("[lightquant-skill-sync] 当前环境无法完整检查本机 Skill；已跳过缺失文件，不视为失败。");
    return;
  }

  console.log(JSON.stringify({
    ok: true,
    checked: checked.length,
    manifest: path.relative(root, manifestPath),
    syncedAt: manifest.syncedAt
  }, null, 2));
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function printMissingNotice(missing) {
  console.warn("[lightquant-skill-sync] 以下本机 Skill 文件不存在，可能是当前环境没有 Codex 本机 Skill：");
  for (const item of missing) {
    console.warn(`- ${item}`);
  }
}

main();
