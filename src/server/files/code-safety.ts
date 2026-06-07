import type { UploadedFileScanStatus } from "@/server/domain";

export type CodeSafetyScanResult = {
  scanStatus: UploadedFileScanStatus;
  riskFlags: string[];
};

const BLOCKED_PATTERNS: Array<{ flag: string; pattern: RegExp }> = [
  {
    flag: "PRIVATE_KEY",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/i
  },
  {
    flag: "SECRET_ASSIGNMENT",
    pattern: /\b(api[_-]?key|secret[_-]?key|access[_-]?token|password)\b\s*[:=]\s*["'][^"'\s]{8,}["']/i
  },
  {
    flag: "AUTHORIZATION_BEARER",
    pattern: /\bauthorization\b\s*[:=]\s*["']?\s*bearer\s+[a-z0-9._~+/=-]{16,}/i
  },
  {
    flag: "BEARER_TOKEN",
    pattern: /\bbearer\s+[a-z0-9._~+/=-]{24,}/i
  }
];

const WARNING_PATTERNS: Array<{ flag: string; pattern: RegExp }> = [
  {
    flag: "OS_SYSTEM",
    pattern: /\bos\.system\s*\(/i
  },
  {
    flag: "SUBPROCESS",
    pattern: /\bsubprocess\.(run|call|popen|check_output|check_call)\s*\(/i
  },
  {
    flag: "EVAL",
    pattern: /\beval\s*\(/i
  },
  {
    flag: "EXEC",
    pattern: /\bexec\s*\(/i
  },
  {
    flag: "WRITE_FILE",
    pattern: /\bopen\s*\([^)]*["']w[bt+]?["']/i
  },
  {
    flag: "DELETE_FILE",
    pattern: /\b(os\.(remove|unlink|rmdir)|shutil\.rmtree|Path\s*\([^)]*\)\.unlink)\s*\(/i
  },
  {
    flag: "SHELL_DELETE",
    pattern: /\brm\s+-rf\b/i
  }
];

export function scanCodeSafety(text: string): CodeSafetyScanResult {
  const blockedFlags = collectFlags(text, BLOCKED_PATTERNS);
  const warningFlags = collectFlags(text, WARNING_PATTERNS);

  if (blockedFlags.length > 0) {
    return {
      scanStatus: "BLOCKED",
      riskFlags: unique([...blockedFlags, ...warningFlags])
    };
  }

  if (warningFlags.length > 0) {
    return {
      scanStatus: "WARNING",
      riskFlags: warningFlags
    };
  }

  return {
    scanStatus: "PASSED",
    riskFlags: []
  };
}

function collectFlags(text: string, checks: Array<{ flag: string; pattern: RegExp }>) {
  return checks.filter((check) => check.pattern.test(text)).map((check) => check.flag);
}

function unique(values: string[]) {
  return [...new Set(values)];
}
