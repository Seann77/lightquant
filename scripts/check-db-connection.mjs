import { existsSync } from "node:fs";
import pg from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });
loadEnv({ path: ".env.local", quiet: true, override: true });

const { Client } = pg;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        envLocalExists: existsSync(".env.local"),
        hasDatabaseUrl: false,
        code: "MISSING_DATABASE_URL",
        nextActions: [
          "Set DATABASE_URL in .env.local.",
          "Use a PostgreSQL connection string copied from the current Supabase project or another PostgreSQL provider."
        ]
      },
      null,
      2
    )
  );
  process.exit(1);
}

let parsed;

try {
  parsed = new URL(databaseUrl);
} catch {
  console.log(
    JSON.stringify(
      {
        ok: false,
        envLocalExists: existsSync(".env.local"),
        hasDatabaseUrl: true,
        code: "INVALID_DATABASE_URL",
        nextActions: [
          "Replace DATABASE_URL with a valid postgresql:// connection string.",
          "Do not paste quoted shell exports or dashboard labels into DATABASE_URL."
        ]
      },
      null,
      2
    )
  );
  process.exit(1);
}

const startedAt = Date.now();
const client = new Client({
  connectionString: getConnectionString(parsed, databaseUrl),
  connectionTimeoutMillis: 8000,
  ssl: shouldUseExplicitSsl(parsed) ? { rejectUnauthorized: false } : undefined
});

try {
  await client.connect();
  const result = await client.query("select 1 as ok");

  console.log(
    JSON.stringify(
      {
        ok: true,
        envLocalExists: existsSync(".env.local"),
        dataMode: process.env.LIGHTQUANT_DATA_MODE ?? "(empty)",
        databaseUrl: describeDatabaseUrl(parsed),
        handshakeMs: Date.now() - startedAt,
        result: result.rows[0]?.ok
      },
      null,
      2
    )
  );
} catch (error) {
  const errorCode = error?.code ?? error?.name ?? "UNKNOWN";
  const errorMessage = sanitizeErrorMessage(error?.message);

  console.log(
    JSON.stringify(
      {
        ok: false,
        envLocalExists: existsSync(".env.local"),
        dataMode: process.env.LIGHTQUANT_DATA_MODE ?? "(empty)",
        databaseUrl: describeDatabaseUrl(parsed),
        handshakeMs: Date.now() - startedAt,
        error: {
          code: errorCode,
          message: errorMessage
        },
        nextActions: getNextActions(parsed, errorCode, errorMessage)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} finally {
  try {
    await client.end();
  } catch {
    // Ignore close errors in a diagnostic script.
  }
}

function describeDatabaseUrl(url) {
  return {
    protocol: url.protocol,
    hostType: getHostType(url.hostname),
    port: url.port || "(default)",
    hasPassword: Boolean(url.password),
    hasSslmode: Boolean(url.searchParams.get("sslmode")),
    sslmode: url.searchParams.get("sslmode") || "(none)",
    usernameShape: url.username.includes(".") ? "contains-dot" : url.username.includes("@") ? "contains-at" : "plain"
  };
}

function getHostType(hostname) {
  if (hostname.includes("pooler.supabase.com")) {
    return "supabase-pooler";
  }

  if (hostname.includes("supabase.co") || hostname.includes("supabase.com")) {
    return "supabase-direct-or-other";
  }

  return "other";
}

function shouldUseExplicitSsl(url) {
  return url.searchParams.get("sslmode") !== "disable" && getHostType(url.hostname).startsWith("supabase");
}

function getConnectionString(url, fallback) {
  if (!shouldUseExplicitSsl(url)) {
    return fallback;
  }

  const sanitized = new URL(url.toString());
  sanitized.searchParams.delete("sslmode");
  return sanitized.toString();
}

function sanitizeErrorMessage(message) {
  return String(message || "")
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "postgresql://***")
    .replace(/tenant\/user\s+[^\s]+\s+not found/gi, "tenant/user *** not found")
    .replace(/user\s+\"[^\"]+\"/gi, "user \"***\"");
}

function getNextActions(url, code, message) {
  const hostType = getHostType(url.hostname);
  const actions = [];

  if (hostType === "supabase-pooler" && /tenant\/user \*\*\* not found/i.test(message)) {
    actions.push("The Supabase pooler did not recognize the tenant/user in DATABASE_URL.");
    actions.push("Copy the PostgreSQL connection string again from the current Supabase project dashboard.");
    actions.push("For Supabase pooler, use the exact Session pooler connection string ending in port 5432 from the dashboard Connect panel.");
    actions.push("Use Direct connection only if your network can reach it, such as IPv6-capable networks or projects with the IPv4 add-on.");
    actions.push("Do not manually edit the project ref or username shape.");
    return actions;
  }

  if (hostType === "supabase-pooler" && /no tenant identifier/i.test(message)) {
    actions.push("The Supabase pooler connection is missing the tenant identifier in the username or SNI host.");
    actions.push("Copy the full pooler connection string from the Supabase dashboard instead of simplifying the username.");
    return actions;
  }

  if (code === "ENOTFOUND") {
    actions.push("The database host could not be resolved by DNS.");
    actions.push("Verify the connection string was copied from the active database project.");
    return actions;
  }

  if (/password authentication failed/i.test(message)) {
    actions.push("The database host is reachable, but authentication failed.");
    actions.push("Re-copy the database password or reset it in the provider dashboard, then update .env.local.");
    return actions;
  }

  if (/self-signed certificate/i.test(message)) {
    actions.push("The connection reached the database but failed certificate validation.");
    actions.push("For local Supabase testing, use this project script because it passes SSL options directly to node-postgres.");
    actions.push("Avoid relying on sslmode=require alone in local Node versions that treat it as certificate verification.");
    return actions;
  }

  actions.push("Review DATABASE_URL in .env.local without printing it.");
  actions.push("Run npm run check:db again after updating the connection string.");
  return actions;
}
