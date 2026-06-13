import { readFileSync } from "node:fs";

const file = ".env.example";
const content = readFileSync(file, "utf8");
const lines = content.split(/\r?\n/);
const errors = [];

const forbiddenPatterns = [
  {
    name: "zhipu",
    pattern: /zhipu/i
  },
  {
    name: "glm-model",
    pattern: /\bglm[-_a-z0-9.]*/i
  }
];

for (const rule of forbiddenPatterns) {
  if (rule.pattern.test(content)) {
    errors.push(`${file} contains forbidden legacy AI config: ${rule.name}`);
  }
}

const values = new Map();

for (const line of lines) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    continue;
  }

  const equalsAt = trimmed.indexOf("=");

  if (equalsAt <= 0) {
    continue;
  }

  values.set(trimmed.slice(0, equalsAt), trimmed.slice(equalsAt + 1));
}

assertPlaceholder("AUTH_SECRET", (value) => value === "" || value.startsWith("replace-with-"));
assertPlaceholder("DATABASE_URL", (value) => value === "" || value.includes("USER:PASSWORD@HOST"));

for (const [name, value] of values) {
  if (!looksSensitive(name) || value === "") {
    continue;
  }

  if (allowedNonSecretExample(name, value)) {
    continue;
  }

  if (!looksLikePlaceholder(value)) {
    errors.push(`${file} has a non-placeholder value for ${name}`);
  }
}

if (errors.length > 0) {
  console.error("Environment example check failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Environment example check passed.");

function assertPlaceholder(name, isAllowed) {
  const value = values.get(name);

  if (value === undefined) {
    errors.push(`${file} is missing ${name}`);
    return;
  }

  if (!isAllowed(value)) {
    errors.push(`${file} has an unsafe example value for ${name}`);
  }
}

function looksSensitive(name) {
  return /(?:SECRET|PASSWORD|PRIVATE_KEY|API_KEY|ACCESS_KEY|CERTIFICATE|TOKEN|DATABASE_URL|AUTH_SECRET)$/i.test(name);
}

function looksLikePlaceholder(value) {
  return (
    value === "" ||
    value.startsWith("replace-with-") ||
    value.includes("USER:PASSWORD@HOST") ||
    value.includes("YOUR_") ||
    value.includes("example")
  );
}

function allowedNonSecretExample(name, value) {
  if (name === "DATABASE_URL") {
    return value.includes("USER:PASSWORD@HOST");
  }

  return false;
}
