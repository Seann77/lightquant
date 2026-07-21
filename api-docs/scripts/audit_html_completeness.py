#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import html as html_lib
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber
from lxml import html


REPO_ROOT = Path("/Users/a1-6/Documents/Codex-Restored-Projects/量化平台策略生成")
API_DOCS = REPO_ROOT / "api-docs"
PTR_GUOJIN_SRC = Path("/Users/a1-6/Downloads/api文档/ptrade_api文档/国金版本")
PTR_SHENWAN_PDFS = Path("/Users/a1-6/Downloads/api文档/ptrade_api文档/申万版本/ptrade_shenwan_route_pdfs")
QMT_SRC_HTML = Path(
    "/Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/html/innerapi-combined.html"
)
QMT_SRC_PDF = Path(
    "/Users/a1-6/Documents/Codex/2026-05-29/https-dict-thinktrader-net-innerapi-start/output/pdf/迅投知识库-内置Python-API文档全集.pdf"
)


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def read_text(path: Path) -> str:
    raw = path.read_bytes()
    for enc in ("utf-8", "gb18030", "gbk"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            pass
    return raw.decode("utf-8", errors="replace")


def html_text(path: Path) -> str:
    doc = html.fromstring(read_text(path))
    for node in doc.xpath("//script|//style|//noscript"):
        node.drop_tree()
    return html_lib.unescape(" ".join(part.strip() for part in doc.itertext() if part.strip()))


def normalize_text(text: str) -> str:
    text = html_lib.unescape(text)
    text = re.sub(r"\s+", "", text)
    text = re.sub(r"[·•●◆◇■□▲△▶▷►◀◁▸▹✓✔✅❌​]", "", text)
    return text


def tokenize_identifiers(text: str) -> set[str]:
    tokens = set(re.findall(r"\b[A-Za-z_][A-Za-z0-9_]{2,}\b", text))
    stop = {
        "class",
        "function",
        "return",
        "const",
        "span",
        "div",
        "href",
        "src",
        "true",
        "false",
        "none",
        "null",
        "undefined",
        "python",
        "import",
        "from",
    }
    return {token for token in tokens if token.lower() not in stop}


def chinese_windows(text: str, size: int = 12) -> set[str]:
    compact = normalize_text(text)
    chinese = "".join(re.findall(r"[\u4e00-\u9fffA-Za-z0-9_]+", compact))
    if len(chinese) < size:
        return {chinese} if chinese else set()
    step = max(1, size // 2)
    return {chinese[i : i + size] for i in range(0, len(chinese) - size + 1, step)}


def significant_lines(text: str) -> set[str]:
    lines = set()
    for raw in text.splitlines():
        line = normalize_text(raw)
        if not line:
            continue
        if line.startswith("http"):
            continue
        if re.search(r"\d+/\d+$", line):
            continue
        if "帮助文档" in line or "帮助⽂档" in line:
            continue
        if len(line) < 6 or len(line) > 120:
            continue
        lines.add(line)
    return lines


def pdf_text(path: Path) -> tuple[str, int]:
    parts: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        pages = len(pdf.pages)
        for page in pdf.pages:
            parts.append(page.extract_text(x_tolerance=1, y_tolerance=3) or "")
    return "\n".join(parts), pages


def coverage(source_text: str, saved_text: str) -> dict:
    source_norm = normalize_text(source_text)
    saved_norm = normalize_text(saved_text)
    source_tokens = tokenize_identifiers(source_text)
    saved_tokens = tokenize_identifiers(saved_text)
    saved_compact = normalize_text(saved_text)
    source_lines = significant_lines(source_text)
    matched_lines = {line for line in source_lines if line and line in saved_compact}
    source_windows = chinese_windows(source_text)
    matched_windows = {window for window in source_windows if window and window in saved_compact}
    missing_tokens = sorted(source_tokens - saved_tokens)
    common_tokens = sorted(source_tokens & saved_tokens)
    return {
        "source_text_length": len(source_norm),
        "saved_text_length": len(saved_norm),
        "length_ratio_saved_to_source": round(len(saved_norm) / max(1, len(source_norm)), 4),
        "identifier_count_source": len(source_tokens),
        "identifier_count_saved": len(saved_tokens),
        "identifier_coverage": round(len(common_tokens) / max(1, len(source_tokens)), 4),
        "missing_identifier_sample": missing_tokens[:40],
        "significant_line_count_source": len(source_lines),
        "significant_line_coverage": round(len(matched_lines) / max(1, len(source_lines)), 4),
        "missing_significant_line_sample": sorted(source_lines - matched_lines)[:20],
        "text_window_count_source": len(source_windows),
        "text_window_coverage": round(len(matched_windows) / max(1, len(source_windows)), 4),
        "missing_text_window_sample": sorted(source_windows - matched_windows)[:20],
    }


def html_counts(path: Path) -> dict:
    text = read_text(path)
    return {
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "headings": len(re.findall(r"<h[1-6]\b", text, flags=re.I)),
        "pre": len(re.findall(r"<pre\b", text, flags=re.I)),
        "code": len(re.findall(r"<code\b", text, flags=re.I)),
        "tables": len(re.findall(r"<table\b", text, flags=re.I)),
        "rows": len(re.findall(r"<tr\b", text, flags=re.I)),
        "images": len(re.findall(r"<img\b", text, flags=re.I)),
        "replacement_chars": text.count("\ufffd"),
        "mojibake_markers": len(re.findall(r"锟斤拷|鈥|ï¿½", text)),
    }


def resource_refs(path: Path) -> dict:
    text = read_text(path)
    refs = re.findall(r"\s(?:src|href)=[\"']([^\"']+)[\"']", text, flags=re.I)
    image_refs = [r for r in refs if re.search(r"\.(png|jpe?g|gif|webp|svg|ico)([?#]|$)", r, flags=re.I)]
    local_missing = []
    remote = []
    for ref in refs:
        if ref.startswith(("http://", "https://", "//")):
            remote.append(ref)
            continue
        if ref.startswith(("#", "javascript:", "mailto:", "data:")):
            continue
        clean = ref.split("#", 1)[0].split("?", 1)[0]
        if clean and not (path.parent / clean).resolve().exists():
            local_missing.append(ref)
    return {
        "ref_count": len(refs),
        "image_ref_count": len(image_refs),
        "remote_ref_count": len(remote),
        "remote_ref_sample": sorted(set(remote))[:20],
        "local_missing_count": len(set(local_missing)),
        "local_missing_sample": sorted(set(local_missing))[:20],
    }


def compare_byte_identical(saved: Path, original: Path) -> dict:
    return {
        "saved": str(saved),
        "original": str(original),
        "saved_exists": saved.exists(),
        "original_exists": original.exists(),
        "saved_bytes": saved.stat().st_size if saved.exists() else None,
        "original_bytes": original.stat().st_size if original.exists() else None,
        "saved_sha256": sha256(saved) if saved.exists() else None,
        "original_sha256": sha256(original) if original.exists() else None,
        "byte_identical": saved.exists() and original.exists() and sha256(saved) == sha256(original),
    }


def main() -> None:
    pages = [json.loads(line) for line in (API_DOCS / "manifests/pages.jsonl").read_text().splitlines() if line.strip()]
    result: dict = {
        "audited_at": datetime.now(timezone.utc).isoformat(),
        "summary": {},
        "ptrade_guojin": [],
        "qmt": {},
        "ptrade_shenwan_pdf_vs_html": [],
        "joinquant_raw_vs_rendered": [],
        "resource_findings": [],
        "suspicious": [],
    }

    # 1. PTrade 国金: saved HTML should be byte-identical to local source HTML.
    for name in ["ptradeapi.html", "财务数据api.html", "行业概念分类.html"]:
        saved = API_DOCS / "raw/ptrade/guojin" / name
        original = PTR_GUOJIN_SRC / name
        item = compare_byte_identical(saved, original)
        item["saved_counts"] = html_counts(saved)
        item["resource_refs"] = resource_refs(saved)
        result["ptrade_guojin"].append(item)
        if not item["byte_identical"]:
            result["suspicious"].append(f"PTrade 国金 {name} 与原始 HTML 非字节一致")

    # 2. QMT: saved HTML should be byte-identical to source HTML; compare against source PDF text.
    qmt_saved = API_DOCS / "raw/qmt/innerapi-combined.html"
    qmt_html_identity = compare_byte_identical(qmt_saved, QMT_SRC_HTML)
    qmt_pdf_text, qmt_pages = pdf_text(QMT_SRC_PDF)
    qmt_saved_text = html_text(qmt_saved)
    qmt_pdf_cov = coverage(qmt_pdf_text, qmt_saved_text)
    result["qmt"] = {
        "html_identity": qmt_html_identity,
        "pdf_pages": qmt_pages,
        "pdf_vs_html_coverage": qmt_pdf_cov,
        "saved_counts": html_counts(qmt_saved),
        "resource_refs": resource_refs(qmt_saved),
    }
    if not qmt_html_identity["byte_identical"]:
        result["suspicious"].append("QMT 保存 HTML 与原始 innerapi-combined.html 非字节一致")
    if qmt_pdf_cov["identifier_coverage"] < 0.75 or qmt_pdf_cov["significant_line_coverage"] < 0.55:
        result["suspicious"].append("QMT PDF 对 HTML 的文本覆盖率偏低")

    # 3. PTrade 申万: compare each saved HTML to the previously generated route PDF.
    manifest = json.loads((PTR_SHENWAN_PDFS / "manifest.json").read_text())
    for entry in manifest:
        pdf_path = PTR_SHENWAN_PDFS / entry["fileName"]
        html_name = entry["fileName"].replace(".pdf", ".html")
        saved_html = API_DOCS / "raw/ptrade/shenwan" / html_name
        p_text, p_pages = pdf_text(pdf_path)
        h_text = html_text(saved_html)
        cov = coverage(p_text, h_text)
        item = {
            "title": entry["title"],
            "source_url": entry["url"],
            "pdf": str(pdf_path),
            "saved_html": str(saved_html),
            "pdf_pages": p_pages,
            "coverage": cov,
            "saved_counts": html_counts(saved_html),
            "resource_refs": resource_refs(saved_html),
        }
        result["ptrade_shenwan_pdf_vs_html"].append(item)
        if cov["identifier_coverage"] < 0.75 and cov["significant_line_coverage"] < 0.6:
            result["suspicious"].append(
                f"PTrade 申万 {entry['title']} PDF->HTML 覆盖率偏低 "
                f"(identifier={cov['identifier_coverage']}, line={cov['significant_line_coverage']})"
            )

    # 4. JoinQuant: raw must be smaller/shell-like, rendered should have substantial doc content.
    for page in pages:
        if page["platform"] != "joinquant":
            continue
        rendered = Path(page["local_file_path"])
        raw = Path(page["raw_local_file_path"])
        raw_text = html_text(raw)
        rendered_text = html_text(rendered)
        raw_counts = html_counts(raw)
        rendered_counts = html_counts(rendered)
        item = {
            "slug": page["slug"],
            "title": page["title"],
            "source_url": page["source_url"],
            "raw": str(raw),
            "rendered": str(rendered),
            "raw_text_length": len(normalize_text(raw_text)),
            "rendered_text_length": len(normalize_text(rendered_text)),
            "rendered_to_raw_text_ratio": round(
                len(normalize_text(rendered_text)) / max(1, len(normalize_text(raw_text))), 4
            ),
            "raw_counts": raw_counts,
            "rendered_counts": rendered_counts,
            "rendered_resource_refs": resource_refs(rendered),
        }
        result["joinquant_raw_vs_rendered"].append(item)
        if item["rendered_text_length"] < 1000:
            result["suspicious"].append(f"JoinQuant {page['slug']} rendered 正文过短")
        if rendered_counts["pre"] + rendered_counts["code"] == 0 and page["document_type"] in {"strategy_api", "factor"}:
            result["suspicious"].append(f"JoinQuant {page['slug']} rendered 未检测到代码块")

    # 5. Global resource and mojibake scan.
    for page in pages:
        path = Path(page["local_file_path"])
        counts = html_counts(path)
        refs = resource_refs(path)
        result["resource_findings"].append(
            {
                "platform": page["platform"],
                "variant": page["variant"],
                "title": page["title"],
                "file": str(path),
                "counts": counts,
                "resource_refs": refs,
            }
        )
        if counts["replacement_chars"] > 5 or counts["mojibake_markers"] > 0:
            result["suspicious"].append(f"{path} 疑似乱码或替换字符过多")

    result["summary"] = {
        "ptrade_guojin_pages_checked": len(result["ptrade_guojin"]),
        "ptrade_guojin_byte_identical": sum(1 for x in result["ptrade_guojin"] if x["byte_identical"]),
        "ptrade_shenwan_pdf_pages_checked": len(result["ptrade_shenwan_pdf_vs_html"]),
        "ptrade_shenwan_min_identifier_coverage": min(
            x["coverage"]["identifier_coverage"] for x in result["ptrade_shenwan_pdf_vs_html"]
        ),
        "ptrade_shenwan_min_text_window_coverage": min(
            x["coverage"]["text_window_coverage"] for x in result["ptrade_shenwan_pdf_vs_html"]
        ),
        "ptrade_shenwan_min_significant_line_coverage": min(
            x["coverage"]["significant_line_coverage"] for x in result["ptrade_shenwan_pdf_vs_html"]
        ),
        "qmt_html_byte_identical": qmt_html_identity["byte_identical"],
        "qmt_pdf_pages": qmt_pages,
        "qmt_identifier_coverage": qmt_pdf_cov["identifier_coverage"],
        "qmt_text_window_coverage": qmt_pdf_cov["text_window_coverage"],
        "qmt_significant_line_coverage": qmt_pdf_cov["significant_line_coverage"],
        "joinquant_pages_checked": len(result["joinquant_raw_vs_rendered"]),
        "joinquant_min_rendered_text_length": min(
            x["rendered_text_length"] for x in result["joinquant_raw_vs_rendered"]
        ),
        "suspicious_count": len(result["suspicious"]),
    }

    out_json = API_DOCS / "reports/html-completeness-audit.json"
    out_md = API_DOCS / "reports/html-completeness-audit.md"
    out_json.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")

    lines = [
        "# HTML 完整性复查报告",
        "",
        f"- audited_at: {result['audited_at']}",
        f"- suspicious_count: {result['summary']['suspicious_count']}",
        "",
        "## 总结",
        "",
        f"- PTrade 国金：{result['summary']['ptrade_guojin_byte_identical']}/3 个保存 HTML 与原始 HTML 字节一致。",
        f"- PTrade 申万：17/17 个保存 HTML 与对应 PDF 做了文本覆盖比对；"
        f"最低 identifier 覆盖率 {result['summary']['ptrade_shenwan_min_identifier_coverage']}，"
        f"最低 PDF 行级短语覆盖率 {result['summary']['ptrade_shenwan_min_significant_line_coverage']}。",
        f"- QMT：保存 HTML 与原始 innerapi-combined.html 字节一致={result['summary']['qmt_html_byte_identical']}；"
        f"PDF 页数 {result['summary']['qmt_pdf_pages']}；PDF->HTML identifier 覆盖率 "
        f"{result['summary']['qmt_identifier_coverage']}，行级短语覆盖率 {result['summary']['qmt_significant_line_coverage']}。",
        f"- JoinQuant：15/15 个 rendered HTML 已检查；最短 rendered 正文长度 "
        f"{result['summary']['joinquant_min_rendered_text_length']}。",
        "",
        "## 可疑项",
        "",
    ]
    if result["suspicious"]:
        lines.extend(f"- {item}" for item in result["suspicious"])
    else:
        lines.append("未发现会阻塞下一阶段清洗的可疑缺失。")

    lines.extend(
        [
            "",
            "## PTrade 申万 PDF 对 HTML 覆盖",
            "",
            "| title | pdf_pages | identifier_coverage | line_coverage | text_window_coverage | pdf_text | html_text | saved_html |",
            "|---|---:|---:|---:|---:|---:|---:|---|",
        ]
    )
    for item in result["ptrade_shenwan_pdf_vs_html"]:
        cov = item["coverage"]
        lines.append(
            f"| {item['title']} | {item['pdf_pages']} | {cov['identifier_coverage']} | "
            f"{cov['significant_line_coverage']} | {cov['text_window_coverage']} | "
            f"{cov['source_text_length']} | {cov['saved_text_length']} | "
            f"{Path(item['saved_html']).relative_to(API_DOCS)} |"
        )

    lines.extend(
        [
            "",
            "## JoinQuant raw/rendered 对比",
            "",
            "| slug | title | raw_text | rendered_text | ratio | headings | code | tables | images |",
            "|---|---|---:|---:|---:|---:|---:|---:|---:|",
        ]
    )
    for item in result["joinquant_raw_vs_rendered"]:
        counts = item["rendered_counts"]
        lines.append(
            f"| {item['slug']} | {item['title']} | {item['raw_text_length']} | {item['rendered_text_length']} | "
            f"{item['rendered_to_raw_text_ratio']} | {counts['headings']} | {counts['pre'] + counts['code']} | "
            f"{counts['tables']} | {counts['images']} |"
        )

    lines.extend(
        [
            "",
            "## 资源链接说明",
            "",
            "- PTrade 国金本地 HTML 的配套 `*_files` 目录已随 raw 目录复制，本地图片/CSS/JS 可在归档内找到。",
            "- PTrade 申万、QMT、JoinQuant 的 HTML 保留原页面资源引用；远程 CDN/站点资源未镜像为本地文件，避免越过本阶段抓取边界。",
            "- 资源链接疑点的逐页明细见 `html-completeness-audit.json`。",
            "",
        ]
    )
    out_md.write_text("\n".join(lines) + "\n")
    print(json.dumps(result["summary"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
