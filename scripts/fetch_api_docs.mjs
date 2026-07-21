#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(repoRoot, "api-docs");

const capturedAt = new Date().toISOString();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PTR_GUOJIN_DIR = "/Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本";
const PTR_SHENWAN_MANIFEST =
  "/Users/a1-6/Downloads/api文档/ptrade_api文档/申万版本/ptrade_shenwan_route_pdfs/manifest.json";
const QMT_HTML =
  "/Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html";

const ptradeGuojinOnlineUrl = "http://180.169.107.9:7766/hub/help/api?weworkcfmcode";
const ptradeShenwanEntryUrl = "http://101.71.132.53:9091/hub/help/api";
const joinquantMainUrl =
  "https://www.joinquant.com/help/api/help#api:API%E6%96%87%E6%A1%A3";
const joinquantPages = [
  ["api", "strategy_api"],
  ["Stock", "market_data"],
  ["fund", "market_data"],
  ["Future", "market_data"],
  ["index", "market_data"],
  ["plateData", "market_data"],
  ["factor", "factor"],
  ["factor_values", "factor"],
  ["technicalanalysis", "factor"],
  ["Alpha101", "factor"],
  ["Alpha191", "factor"],
  ["JQData", "research_data"],
  ["macroData", "finance"],
  ["faq", "faq"],
];

const pages = [];
const failures = [];
const sourceManifest = {
  captured_at: capturedAt,
  output_root: outputRoot,
  sources: [],
  online_status: {},
  discovered: {
    joinquant_help_links: [],
    joinquant_new_help_links: [],
  },
};

function toPosix(p) {
  return p.split(path.sep).join("/");
}

async function ensureDirs() {
  await fs.mkdir(path.join(outputRoot, "raw", "qmt"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "raw", "ptrade", "guojin"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "raw", "ptrade", "shenwan"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "raw", "joinquant"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "assets"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "manifests"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "reports"), { recursive: true });
  await fs.mkdir(path.join(outputRoot, "scripts"), { recursive: true });
}

function sha256Buffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function decodeBuffer(buffer, headers = {}) {
  const headerType = headers["content-type"] || headers.get?.("content-type") || "";
  const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("ascii");
  const metaMatch = head.match(/charset=["']?\s*([a-zA-Z0-9_-]+)/i);
  const charset = (headerType.match(/charset=([^;\s]+)/i)?.[1] || metaMatch?.[1] || "utf-8")
    .replace(/["']/g, "")
    .toLowerCase();
  const labels = charset.includes("gb") ? [charset, "gb18030", "utf-8"] : [charset, "utf-8", "gb18030"];
  for (const label of labels) {
    try {
      return new TextDecoder(label).decode(buffer);
    } catch {
      continue;
    }
  }
  return buffer.toString("utf8");
}

function stripTags(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(value) {
  return stripTags(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function firstMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1] : "";
}

function htmlStats(html, localPath = "") {
  const title =
    cleanTitle(firstMatch(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i)) ||
    cleanTitle(firstMatch(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/i)) ||
    cleanTitle(firstMatch(html, /<h2\b[^>]*>([\s\S]*?)<\/h2>/i));
  const bodyHtml = firstMatch(html, /<body\b[^>]*>([\s\S]*?)<\/body>/i) || html;
  const bodyText = stripTags(bodyHtml);
  const stats = {
    title,
    body_text_length: bodyText.length,
    heading_count: (html.match(/<h[1-6]\b/gi) || []).length,
    code_block_count:
      (html.match(/<pre\b/gi) || []).length +
      Math.max(0, (html.match(/<code\b/gi) || []).length - (html.match(/<pre\b/gi) || []).length),
    table_count: (html.match(/<table\b/gi) || []).length,
    table_row_count: (html.match(/<tr\b/gi) || []).length,
    table_cell_count: (html.match(/<t[dh]\b/gi) || []).length,
    image_count: (html.match(/<img\b/gi) || []).length,
    replacement_char_count: (html.match(/\uFFFD/g) || []).length,
    mojibake_marker_count: (html.match(/\u951F\u65A4\u62F7|\u9225|\uFFFD/g) || []).length,
    local_link_issues: [],
    internal_anchor_issues: [],
  };

  if (localPath) {
    const localDir = path.dirname(localPath);
    const ids = new Set();
    for (const match of html.matchAll(/\s(?:id|name)=["']([^"']+)["']/gi)) {
      ids.add(match[1]);
    }
    for (const match of html.matchAll(/\s(?:src|href)=["']([^"']+)["']/gi)) {
      const href = match[1].trim();
      if (!href || href.startsWith("data:") || href.startsWith("javascript:") || href.startsWith("mailto:")) {
        continue;
      }
      if (href.startsWith("#")) {
        const anchor = decodeURIComponent(href.slice(1));
        if (anchor && !ids.has(anchor)) stats.internal_anchor_issues.push(href);
        continue;
      }
      if (/^https?:\/\//i.test(href) || href.startsWith("//")) continue;
      const cleanHref = href.split("#")[0].split("?")[0];
      if (!cleanHref) continue;
      const target = path.resolve(localDir, cleanHref);
      if (!existsSync(target)) stats.local_link_issues.push(href);
    }
    stats.local_link_issues = [...new Set(stats.local_link_issues)].slice(0, 40);
    stats.internal_anchor_issues = [...new Set(stats.internal_anchor_issues)].slice(0, 40);
  }

  return stats;
}

function completenessIssues(record, html) {
  const issues = [];
  const text = stripTags(firstMatch(html, /<body\b[^>]*>([\s\S]*?)<\/body>/i) || html);
  if (!text || text.length < 200) issues.push("HTML正文为空或过短");
  if (/加载中|正在加载|loading/i.test(text) && text.length < 1200) issues.push("疑似仅加载提示");
  if (/登录|登陆|login/i.test(text) && text.length < 1800) issues.push("疑似登录页或登录框正文");
  if (record.document_type === "strategy_api" && record.code_block_count === 0) {
    issues.push("API类页面未检测到代码块");
  }
  if (record.replacement_char_count > 5 || record.mojibake_marker_count > 5) {
    issues.push("疑似中文乱码或替换字符过多");
  }
  if (record.table_count > 0 && record.table_cell_count === 0) {
    issues.push("表格缺少行列单元结构");
  }
  return issues;
}

async function copyRecursive(src, dest) {
  const stat = await fs.stat(src);
  if (stat.isDirectory()) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src);
    for (const entry of entries) {
      await copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

async function readSavedHtml(localPath, headers = {}) {
  const buffer = await fs.readFile(localPath);
  return {
    buffer,
    html: decodeBuffer(buffer, headers),
    sha256: sha256Buffer(buffer),
    size: buffer.length,
  };
}

async function addPageRecord(base, localPath, html, extra = {}) {
  const buffer = await fs.readFile(localPath);
  const stats = htmlStats(html, localPath);
  const record = {
    platform: base.platform,
    variant: base.variant,
    source_role: base.source_role,
    document_type: base.document_type,
    title: base.title || stats.title,
    source_url: base.source_url,
    final_url: base.final_url || base.source_url,
    captured_at: capturedAt,
    http_status: base.http_status ?? null,
    local_file_path: localPath,
    file_size: buffer.length,
    sha256: sha256Buffer(buffer),
    heading_count: stats.heading_count,
    code_block_count: stats.code_block_count,
    table_count: stats.table_count,
    image_count: stats.image_count,
    table_row_count: stats.table_row_count,
    table_cell_count: stats.table_cell_count,
    body_text_length: stats.body_text_length,
    replacement_char_count: stats.replacement_char_count,
    mojibake_marker_count: stats.mojibake_marker_count,
    capture_method: base.capture_method,
    requires_login: base.requires_login ?? false,
    complete: true,
    issues: [],
    local_link_issues: stats.local_link_issues,
    internal_anchor_issues: stats.internal_anchor_issues,
    ...extra,
  };
  record.issues = completenessIssues(record, html);
  record.complete = record.issues.length === 0;
  pages.push(record);
  return record;
}

async function followFetch(url, options = {}) {
  const redirects = [];
  let current = url;
  let response = null;
  for (let i = 0; i < 6; i += 1) {
    response = await fetch(current, {
      redirect: "manual",
      headers: {
        "User-Agent": "Mozilla/5.0 Codex API docs archiver",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.5",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(options.timeoutMs || 25000),
    });
    const location = response.headers.get("location");
    redirects.push({ url: current, status: response.status, location });
    if (![301, 302, 303, 307, 308].includes(response.status) || !location) break;
    current = new URL(location, current).toString();
  }
  const body = Buffer.from(await response.arrayBuffer());
  return {
    body,
    html: decodeBuffer(body, response.headers),
    status: response.status,
    finalUrl: response.url || current,
    redirects,
    headers: Object.fromEntries(response.headers.entries()),
  };
}

async function probeUrl(url) {
  try {
    const result = await followFetch(url, { timeoutMs: 15000, headers: { Accept: "*/*" } });
    return {
      ok: result.status >= 200 && result.status < 400,
      status: result.status,
      final_url: result.finalUrl,
      redirects: result.redirects,
      note: result.status === 502 ? "502 按规则记录但不阻塞" : "",
    };
  } catch (error) {
    try {
      const { stdout } = await execFileAsync("curl", [
        "-I",
        "-L",
        "--max-time",
        "15",
        "-o",
        "/dev/null",
        "-w",
        "%{http_code} %{url_effective}",
        url,
      ]);
      const [code, ...rest] = stdout.trim().split(/\s+/);
      const status = Number(code);
      return {
        ok: status >= 200 && status < 400,
        status,
        final_url: rest.join(" ") || url,
        note: status === 502 ? "502 按规则记录但不阻塞" : "fetch failed; curl probe used",
      };
    } catch {
      // Keep the original fetch failure for audit.
    }
    return { ok: false, status: null, final_url: url, error: String(error) };
  }
}

function slugFromName(name) {
  return String(name)
    .replace(/\.(html|pdf)$/i, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    // npm's transient npx directories are not always added to module resolution in this desktop runtime.
  }
  try {
    return require("playwright");
  } catch {
    // Fall through to explicit npx cache lookup.
  }
  const npxRoot = path.join(process.env.HOME || "", ".npm", "_npx");
  try {
    const candidates = [];
    for (const dir of await fs.readdir(npxRoot)) {
      const candidate = path.join(npxRoot, dir, "node_modules", "playwright");
      if (existsSync(candidate)) candidates.push(candidate);
    }
    candidates.sort();
    if (candidates.length) return require(candidates[candidates.length - 1]);
  } catch {
    // The caller records the final unavailable state.
  }
  throw new Error("Cannot locate Playwright package via project, require path, or ~/.npm/_npx cache");
}

function classifyPtradeGuojin(fileName) {
  if (fileName.includes("财务")) return "finance";
  if (fileName.includes("行业") || fileName.includes("概念")) return "market_data";
  return "strategy_api";
}

function classifyShenwan(url, title) {
  if (/\/api\//.test(url)) {
    if (/\/list\.html$/i.test(url)) return "api_index";
    if (/factor/i.test(url) || title.includes("指标")) return "factor";
    if (/data/i.test(url)) return "market_data";
    return "strategy_api";
  }
  if (/qa/.test(url)) return "faq";
  if (/changelog/.test(url)) return "changelog";
  return "guide";
}

async function archivePtradeGuojin() {
  const destDir = path.join(outputRoot, "raw", "ptrade", "guojin");
  const requiredFiles = ["ptradeapi.html", "财务数据api.html", "行业概念分类.html"];
  const entries = await fs.readdir(PTR_GUOJIN_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.endsWith("_files")) {
      await copyRecursive(path.join(PTR_GUOJIN_DIR, entry.name), path.join(destDir, entry.name));
    }
  }
  for (const fileName of requiredFiles) {
    const src = path.join(PTR_GUOJIN_DIR, fileName);
    const dest = path.join(destDir, fileName);
    try {
      await fs.copyFile(src, dest);
      const { html } = await readSavedHtml(dest);
      await addPageRecord(
        {
          platform: "ptrade",
          variant: "guojin",
          source_role: "primary",
          document_type: classifyPtradeGuojin(fileName),
          source_url: `file://${src}`,
          final_url: `file://${src}`,
          http_status: null,
          capture_method: "static",
          requires_login: false,
        },
        dest,
        html,
      );
    } catch (error) {
      failures.push({ platform: "ptrade", variant: "guojin", url: src, error: String(error) });
    }
  }
  sourceManifest.sources.push({
    platform: "ptrade",
    variant: "guojin",
    source_role: "primary",
    local_source_dir: PTR_GUOJIN_DIR,
    online_url: ptradeGuojinOnlineUrl,
    required_files: requiredFiles,
  });
}

async function archiveQmt() {
  const dest = path.join(outputRoot, "raw", "qmt", "innerapi-combined.html");
  try {
    await fs.copyFile(QMT_HTML, dest);
    const { html } = await readSavedHtml(dest);
    await addPageRecord(
      {
        platform: "qmt",
        variant: "builtin-python",
        source_role: "primary",
        document_type: "strategy_api",
        source_url: `file://${QMT_HTML}`,
        final_url: `file://${QMT_HTML}`,
        http_status: null,
        capture_method: "static",
        requires_login: false,
      },
      dest,
      html,
    );
    sourceManifest.sources.push({
      platform: "qmt",
      variant: "builtin-python",
      source_role: "primary",
      local_source_file: QMT_HTML,
      note: "直接复制现有结构化 HTML；未对 PDF 做 OCR。",
    });
  } catch (error) {
    failures.push({ platform: "qmt", variant: "builtin-python", url: QMT_HTML, error: String(error) });
  }
}

async function archivePtradeShenwan() {
  const manifest = JSON.parse(await fs.readFile(PTR_SHENWAN_MANIFEST, "utf8"));
  const destDir = path.join(outputRoot, "raw", "ptrade", "shenwan");
  sourceManifest.sources.push({
    platform: "ptrade",
    variant: "shenwan",
    source_role: "supplementary",
    entry_url: ptradeShenwanEntryUrl,
    route_manifest: PTR_SHENWAN_MANIFEST,
    route_count: manifest.length,
  });

  for (const item of manifest) {
    const slug = slugFromName(item.fileName);
    const dest = path.join(destDir, `${slug}.html`);
    try {
      const result = await followFetch(item.url, { timeoutMs: 30000 });
      await fs.writeFile(dest, result.body);
      await addPageRecord(
        {
          platform: "ptrade",
          variant: "shenwan",
          source_role: "supplementary",
          document_type: classifyShenwan(item.url, item.title),
          title: item.title,
          source_url: item.url,
          final_url: result.finalUrl,
          http_status: result.status,
          capture_method: "static",
          requires_login: false,
        },
        dest,
        result.html,
        { redirects: result.redirects, source_file_name: item.fileName },
      );
    } catch (error) {
      failures.push({ platform: "ptrade", variant: "shenwan", url: item.url, error: String(error) });
    }
    await sleep(800);
  }
}

async function launchBrowser(playwright) {
  const args = ["--disable-dev-shm-usage", "--no-sandbox"];
  try {
    return await playwright.chromium.launch({ headless: true, channel: "chrome", args });
  } catch (chromeError) {
    try {
      return await playwright.chromium.launch({ headless: true, args });
    } catch (chromiumError) {
      chromiumError.message = `${chromiumError.message}\nChrome launch error: ${chromeError.message}`;
      throw chromiumError;
    }
  }
}

async function renderJoinquantPage(browser, url) {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 1600 },
    userAgent: "Mozilla/5.0 Codex API docs archiver",
    locale: "zh-CN",
  });
  let response = null;
  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch {
      // Dynamic docs may keep analytics or sockets open. A settled DOM is enough for capture.
    }
    try {
      await page.waitForFunction(
        () => {
          const text = document.body?.innerText || "";
          const codeLike = document.querySelectorAll("pre, code, table, h1, h2, h3").length;
          return text.length > 1200 && codeLike > 2 && !/^loading$/i.test(text.trim());
        },
        { timeout: 25000 },
      );
    } catch {
      // Save what the browser has; completeness checks will mark suspicious pages.
    }
    await page.waitForTimeout(2500);
    return {
      html: await page.content(),
      finalUrl: page.url(),
      status: response?.status() ?? null,
      title: await page.title(),
    };
  } finally {
    await page.close();
  }
}

function extractJoinquantLinks(html) {
  const found = new Set();
  for (const match of html.matchAll(/\shref=["']([^"']+)["']/gi)) {
    const rawHref = match[1].trim();
    if (!rawHref) continue;
    try {
      const url = new URL(rawHref, "https://www.joinquant.com/help/api/help");
      if (url.hostname === "www.joinquant.com" && url.pathname === "/help/api/help") {
        found.add(url.toString());
      }
    } catch {
      continue;
    }
  }
  return [...found].sort();
}

function normalizeJoinquantDocumentPages(urls) {
  const docs = new Set();
  for (const item of urls) {
    try {
      const url = new URL(item);
      const name = url.searchParams.get("name");
      if (url.hostname !== "www.joinquant.com" || url.pathname !== "/help/api/help") continue;
      if (name) {
        docs.add(`https://www.joinquant.com/help/api/help?name=${encodeURIComponent(name)}`);
      } else if (!url.search && !url.hash) {
        docs.add("https://www.joinquant.com/help/api/help");
      }
    } catch {
      continue;
    }
  }
  return [...docs].sort();
}

async function archiveJoinquant() {
  let playwright;
  try {
    playwright = await loadPlaywright();
  } catch (error) {
    failures.push({
      platform: "joinquant",
      variant: "strategy-api",
      url: joinquantMainUrl,
      error: `Playwright unavailable: ${error.message}`,
    });
    return;
  }

  const browser = await launchBrowser(playwright);
  const targets = [
    { slug: "main", url: joinquantMainUrl, document_type: "strategy_api", source_role: "primary" },
    ...joinquantPages.map(([name, document_type]) => ({
      slug: name,
      url: `https://www.joinquant.com/help/api/help?name=${encodeURIComponent(name)}`,
      document_type,
      source_role: name === "api" ? "primary" : "supplementary",
    })),
  ];
  sourceManifest.sources.push({
    platform: "joinquant",
    variant: "web-help",
    route_count: targets.length,
    main_url: joinquantMainUrl,
    listed_pages: targets.map((item) => item.url),
    note: "raw.html 为服务器直接响应，rendered.html 为真实浏览器执行 JavaScript 后 DOM。",
  });

  try {
    for (const target of targets) {
      const dir = path.join(outputRoot, "raw", "joinquant", target.slug);
      await fs.mkdir(dir, { recursive: true });
      const rawPath = path.join(dir, "raw.html");
      const renderedPath = path.join(dir, "rendered.html");
      const metadataPath = path.join(dir, "metadata.json");
      try {
        const raw = await followFetch(target.url, { timeoutMs: 30000 });
        await fs.writeFile(rawPath, raw.body);
        await sleep(800);
        const rendered = await renderJoinquantPage(browser, target.url);
        await fs.writeFile(renderedPath, rendered.html, "utf8");
        const record = await addPageRecord(
          {
            platform: "joinquant",
            variant: "web-help",
            source_role: target.source_role,
            document_type: target.document_type,
            source_url: target.url,
            final_url: rendered.finalUrl,
            http_status: rendered.status,
            capture_method: "rendered",
            requires_login: false,
          },
          renderedPath,
          rendered.html,
          {
            raw_local_file_path: rawPath,
            raw_http_status: raw.status,
            raw_final_url: raw.finalUrl,
            raw_file_size: raw.body.length,
            raw_sha256: sha256Buffer(raw.body),
            slug: target.slug,
          },
        );
        const rawStats = htmlStats(raw.html, rawPath);
        const metadata = {
          ...record,
          browser_title: rendered.title,
          raw: {
            source_url: target.url,
            final_url: raw.finalUrl,
            http_status: raw.status,
            local_file_path: rawPath,
            file_size: raw.body.length,
            sha256: sha256Buffer(raw.body),
            heading_count: rawStats.heading_count,
            code_block_count: rawStats.code_block_count,
            table_count: rawStats.table_count,
            image_count: rawStats.image_count,
            body_text_length: rawStats.body_text_length,
            redirects: raw.redirects,
          },
        };
        await fs.writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");
        if (target.slug === "main") {
          const discovered = extractJoinquantLinks(rendered.html);
          sourceManifest.discovered.joinquant_help_links = discovered;
          const discoveredPages = normalizeJoinquantDocumentPages(discovered);
          sourceManifest.discovered.joinquant_document_pages = discoveredPages;
          const listed = new Set(normalizeJoinquantDocumentPages(targets.map((item) => item.url)));
          sourceManifest.discovered.joinquant_new_document_pages = discoveredPages.filter((url) => !listed.has(url));
        }
      } catch (error) {
        failures.push({ platform: "joinquant", variant: "web-help", url: target.url, error: String(error) });
      }
      await sleep(1200);
    }
  } finally {
    await browser.close();
  }
}

function extractApiNames(html) {
  const text = stripTags(html);
  const names = new Set();
  for (const match of text.matchAll(/\b([A-Za-z_][A-Za-z0-9_]{2,})\s*\(/g)) {
    const name = match[1];
    if (!["if", "for", "while", "print", "len", "range", "str", "int", "float"].includes(name)) {
      names.add(name);
    }
  }
  return [...names].sort();
}

async function ptradeVersionDifferences() {
  const guojinRecords = pages.filter((p) => p.platform === "ptrade" && p.variant === "guojin");
  const shenwanRecords = pages.filter((p) => p.platform === "ptrade" && p.variant === "shenwan");
  const guojinNames = new Set();
  const shenwanNames = new Set();
  for (const record of guojinRecords) {
    const html = (await readSavedHtml(record.local_file_path)).html;
    for (const name of extractApiNames(html)) guojinNames.add(name);
  }
  for (const record of shenwanRecords) {
    const html = (await readSavedHtml(record.local_file_path)).html;
    for (const name of extractApiNames(html)) shenwanNames.add(name);
  }
  const onlyGuojin = [...guojinNames].filter((name) => !shenwanNames.has(name));
  const onlyShenwan = [...shenwanNames].filter((name) => !guojinNames.has(name));
  const common = [...guojinNames].filter((name) => shenwanNames.has(name));
  return {
    guojin_page_count: guojinRecords.length,
    shenwan_page_count: shenwanRecords.length,
    extracted_api_name_count_guojin: guojinNames.size,
    extracted_api_name_count_shenwan: shenwanNames.size,
    common_api_name_count: common.length,
    only_guojin: onlyGuojin,
    only_shenwan: onlyShenwan,
  };
}

function groupPages() {
  const groups = new Map();
  for (const page of pages) {
    const key = `${page.platform}/${page.variant}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(page);
  }
  return groups;
}

function mdEscape(value) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function relativeOut(p) {
  return toPosix(path.relative(outputRoot, p));
}

async function writeReports() {
  const shaGroups = new Map();
  for (const page of pages) {
    if (!shaGroups.has(page.sha256)) shaGroups.set(page.sha256, []);
    shaGroups.get(page.sha256).push(page);
  }
  const duplicates = [...shaGroups.values()].filter((items) => items.length > 1);
  const incomplete = pages.filter((page) => !page.complete);
  const ptradeDiff = await ptradeVersionDifferences();

  const successCount = pages.length;
  const fetchLines = [
    "# API 文档抓取报告",
    "",
    `- captured_at: ${capturedAt}`,
    `- output_root: ${outputRoot}`,
    `- success_pages: ${successCount}`,
    `- failed_pages: ${failures.length}`,
    `- incomplete_pages: ${incomplete.length}`,
    "",
    "## 在线入口状态",
    "",
    `- PTrade 国金在线入口: ${JSON.stringify(sourceManifest.online_status.ptrade_guojin)}`,
    `- PTrade 申万入口: ${JSON.stringify(sourceManifest.online_status.ptrade_shenwan_entry)}`,
    "",
    "## 失败页面",
    "",
    failures.length
      ? "| platform | variant | url | reason |\n|---|---|---|---|\n" +
          failures
            .map((f) => `| ${mdEscape(f.platform)} | ${mdEscape(f.variant)} | ${mdEscape(f.url)} | ${mdEscape(f.error)} |`)
            .join("\n")
      : "无。",
    "",
    "## 已保存页面统计",
    "",
    "| platform | variant | document_type | title | method | status | headings | code | tables | images | complete | file |",
    "|---|---|---|---|---|---:|---:|---:|---:|---:|---|---|",
    ...pages.map(
      (p) =>
        `| ${p.platform} | ${p.variant} | ${p.document_type} | ${mdEscape(p.title)} | ${p.capture_method} | ${
          p.http_status ?? ""
        } | ${p.heading_count} | ${p.code_block_count} | ${p.table_count} | ${p.image_count} | ${
          p.complete ? "yes" : "no"
        } | ${relativeOut(p.local_file_path)} |`,
    ),
    "",
    "## 疑似不完整页面",
    "",
    incomplete.length
      ? "| platform | variant | title | file | issues |\n|---|---|---|---|---|\n" +
          incomplete
            .map(
              (p) =>
                `| ${p.platform} | ${p.variant} | ${mdEscape(p.title)} | ${relativeOut(p.local_file_path)} | ${mdEscape(
                  p.issues.join("; "),
                )} |`,
            )
            .join("\n")
      : "无。",
    "",
    "## 重复页面",
    "",
    duplicates.length
      ? duplicates
          .map((items) => `- ${items[0].sha256}: ${items.map((p) => relativeOut(p.local_file_path)).join(", ")}`)
          .join("\n")
      : "未发现 SHA-256 完全重复页面。",
    "",
    "## JoinQuant 主页面发现的独立文档页",
    "",
    sourceManifest.discovered.joinquant_document_pages?.length
      ? sourceManifest.discovered.joinquant_document_pages.map((url) => `- ${url}`).join("\n")
      : "未提取到新链接。",
    "",
    "## JoinQuant 清单外独立文档页",
    "",
    sourceManifest.discovered.joinquant_new_document_pages?.length
      ? sourceManifest.discovered.joinquant_new_document_pages.map((url) => `- ${url}`).join("\n")
      : "未发现清单外同路径文档链接。",
    "",
  ];

  const coverageLines = [
    "# API 文档覆盖报告",
    "",
    "## 平台汇总",
    "",
    "| platform/variant | pages | static | rendered | complete | incomplete |",
    "|---|---:|---:|---:|---:|---:|",
    ...[...groupPages().entries()].map(([key, items]) => {
      const staticCount = items.filter((p) => p.capture_method === "static").length;
      const renderedCount = items.filter((p) => p.capture_method === "rendered").length;
      const completeCount = items.filter((p) => p.complete).length;
      return `| ${key} | ${items.length} | ${staticCount} | ${renderedCount} | ${completeCount} | ${
        items.length - completeCount
      } |`;
    }),
    "",
    "## 文件清单",
    "",
    "| platform | variant | document_type | title | source_url | final_url | file | size | sha256 | headings | code | tables | images |",
    "|---|---|---|---|---|---|---|---:|---|---:|---:|---:|---:|",
    ...pages.map(
      (p) =>
        `| ${p.platform} | ${p.variant} | ${p.document_type} | ${mdEscape(p.title)} | ${mdEscape(
          p.source_url,
        )} | ${mdEscape(p.final_url)} | ${relativeOut(p.local_file_path)} | ${p.file_size} | ${p.sha256} | ${
          p.heading_count
        } | ${p.code_block_count} | ${p.table_count} | ${p.image_count} |`,
    ),
    "",
    "## 资源与锚点疑点",
    "",
    ...pages
      .filter((p) => p.local_link_issues.length || p.internal_anchor_issues.length)
      .map(
        (p) =>
          `- ${relativeOut(p.local_file_path)}: local_link_issues=${p.local_link_issues.length}, internal_anchor_issues=${p.internal_anchor_issues.length}`,
      ),
  ];

  const diffLines = [
    "# PTrade 版本差异入口",
    "",
    "国金版标记为 primary，申万版标记为 supplementary。申万版仅作为补充和差异核对入口；本阶段未用申万定义覆盖国金接口定义。",
    "",
    "## 页面级统计",
    "",
    `- guojin_page_count: ${ptradeDiff.guojin_page_count}`,
    `- shenwan_page_count: ${ptradeDiff.shenwan_page_count}`,
    `- extracted_api_name_count_guojin: ${ptradeDiff.extracted_api_name_count_guojin}`,
    `- extracted_api_name_count_shenwan: ${ptradeDiff.extracted_api_name_count_shenwan}`,
    `- common_api_name_count: ${ptradeDiff.common_api_name_count}`,
    "",
    "## 国金独有候选接口名",
    "",
    ptradeDiff.only_guojin.length ? ptradeDiff.only_guojin.map((name) => `- ${name}`).join("\n") : "无。",
    "",
    "## 申万独有候选接口名",
    "",
    ptradeDiff.only_shenwan.length ? ptradeDiff.only_shenwan.map((name) => `- ${name}`).join("\n") : "无。",
    "",
    "## 差异核对入口",
    "",
    "- 国金主接口: raw/ptrade/guojin/ptradeapi.html",
    "- 国金财务数据: raw/ptrade/guojin/财务数据api.html",
    "- 国金行业概念: raw/ptrade/guojin/行业概念分类.html",
    "- 申万接口清单: raw/ptrade/shenwan/06_api_list.html",
    "- 申万系统接口: raw/ptrade/shenwan/07_api_system.html",
    "- 申万数据接口: raw/ptrade/shenwan/08_api_data.html",
    "- 申万交易接口: raw/ptrade/shenwan/09_api_trade.html",
    "",
  ];

  await fs.writeFile(path.join(outputRoot, "reports", "fetch-report.md"), `${fetchLines.join("\n")}\n`, "utf8");
  await fs.writeFile(path.join(outputRoot, "reports", "coverage-report.md"), `${coverageLines.join("\n")}\n`, "utf8");
  await fs.writeFile(path.join(outputRoot, "reports", "version-differences.md"), `${diffLines.join("\n")}\n`, "utf8");
}

async function writeManifests() {
  sourceManifest.page_count = pages.length;
  sourceManifest.failure_count = failures.length;
  sourceManifest.failures = failures;
  sourceManifest.pages_by_platform = [...groupPages().entries()].map(([key, items]) => ({
    key,
    count: items.length,
    incomplete: items.filter((p) => !p.complete).length,
  }));
  await fs.writeFile(
    path.join(outputRoot, "manifests", "source_manifest.json"),
    `${JSON.stringify(sourceManifest, null, 2)}\n`,
    "utf8",
  );
  await fs.writeFile(
    path.join(outputRoot, "manifests", "pages.jsonl"),
    `${pages.map((page) => JSON.stringify(page)).join("\n")}\n`,
    "utf8",
  );
}

async function copyScriptForAudit() {
  await fs.copyFile(__filename, path.join(outputRoot, "scripts", "fetch_api_docs.mjs"));
}

async function main() {
  await ensureDirs();
  sourceManifest.online_status.ptrade_guojin = await probeUrl(ptradeGuojinOnlineUrl);
  await sleep(700);
  sourceManifest.online_status.ptrade_shenwan_entry = await probeUrl(ptradeShenwanEntryUrl);
  await sleep(700);

  await archivePtradeGuojin();
  await archiveQmt();
  await archivePtradeShenwan();
  await archiveJoinquant();
  await writeReports();
  await writeManifests();
  await copyScriptForAudit();

  const summary = {
    captured_at: capturedAt,
    output_root: outputRoot,
    success_pages: pages.length,
    failed_pages: failures.length,
    incomplete_pages: pages.filter((page) => !page.complete).length,
    by_platform: sourceManifest.pages_by_platform,
  };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
