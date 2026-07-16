const baseUrl = resolveBaseUrl();

const pages = [
  {
    path: "/chat?mode=strategy",
    name: "strategy generation",
    includes: ["LightQuant", "策略生成"],
    excludes: ["每次策略生成消耗 50 积分"]
  },
  {
    path: "/chat?mode=convert",
    name: "code conversion",
    includes: ["LightQuant", "平台代码转换", "开始转换"],
    excludes: ["每次平台转换消耗 200 积分"]
  },
  {
    path: "/code-analysis",
    name: "code analysis",
    includes: ["LightQuant", "代码翻译解析", "开始解析"],
    excludes: ["每次代码解析消耗 100 积分"]
  },
  {
    path: "/credits",
    name: "credits",
    includes: ["LightQuant", "积分流水"]
  },
  {
    path: "/admin",
    name: "admin gate",
    includes: ["请先登录"]
  }
];

const forbiddenText = [
  "服务暂时不可用",
  "服务不可用"
];

console.log("LightQuant local UI page smoke test");
console.log(
  JSON.stringify(
    {
      baseUrl,
      mutatesBusinessData: false,
      callsRealLlms: false,
      callsRealPaymentProviders: false,
      pages: pages.map((page) => page.path),
      note: "Fetches core local pages and checks status plus key SSR text. It does not log in, submit forms, call models, or trigger payment."
    },
    null,
    2
  )
);

const results = [];

for (const page of pages) {
  const url = `${baseUrl}${page.path}`;
  const response = await fetch(url, {
    headers: {
      accept: "text/html"
    },
    redirect: "manual"
  });
  const body = await response.text();
  const missing = page.includes.filter((text) => !body.includes(text));
  const forbidden = [...forbiddenText, ...(page.excludes ?? [])].filter((text) => body.includes(text));

  results.push({
    name: page.name,
    path: page.path,
    status: response.status,
    ok: response.ok,
    missing,
    forbidden
  });
}

const failures = results.filter((result) => !result.ok || result.missing.length > 0 || result.forbidden.length > 0);

console.log(
  JSON.stringify(
    {
      ok: failures.length === 0,
      results
    },
    null,
    2
  )
);

if (failures.length > 0) {
  process.exit(1);
}

function resolveBaseUrl() {
  const explicitBaseUrl = process.env.SMOKE_BASE_URL?.trim();

  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || process.env.APP_PORT?.trim();

  if (port) {
    return `http://127.0.0.1:${port}`.replace(/\/$/, "");
  }

  return "http://127.0.0.1:3010";
}
