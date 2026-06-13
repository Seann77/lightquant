import { readFileSync } from "fs";
import { join } from "path";

export type SkillContent = {
  systemInstruction: string;
  scopeRules: string[];
  outputSchemaDescription: string;
  outOfScopeResponse: string;
};

const CONTENT_ROOT = join(process.cwd(), "src", "server", "ai", "skills", "content");

export function loadSkillContent(fileName: string): SkillContent {
  const sections = parseMarkdownSections(loadTextContent(fileName));

  return {
    systemInstruction: requireSection(sections, "System Instruction"),
    scopeRules: parseBulletList(requireSection(sections, "Scope Rules")),
    outputSchemaDescription: requireSection(sections, "Output Schema"),
    outOfScopeResponse: requireSection(sections, "Out Of Scope Response")
  };
}

export function loadTextContent(fileName: string) {
  return readFileSync(join(CONTENT_ROOT, fileName), "utf8").trim();
}

function parseMarkdownSections(content: string) {
  const sections = new Map<string, string>();
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let currentTitle: string | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^#\s+(.+?)\s*$/);

    if (heading) {
      if (currentTitle) {
        sections.set(currentTitle, buffer.join("\n").trim());
      }

      currentTitle = heading[1];
      buffer = [];
      continue;
    }

    if (currentTitle) {
      buffer.push(line);
    }
  }

  if (currentTitle) {
    sections.set(currentTitle, buffer.join("\n").trim());
  }

  return sections;
}

function requireSection(sections: Map<string, string>, title: string) {
  const value = sections.get(title)?.trim();

  if (!value) {
    throw new Error(`AI skill content missing section: ${title}`);
  }

  return value;
}

function parseBulletList(content: string) {
  const items = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error("AI skill content Scope Rules must contain bullet items");
  }

  return items;
}
