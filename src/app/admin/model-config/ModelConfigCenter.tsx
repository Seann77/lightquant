"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import type {
  AdminAiModelProfileSummary,
  AdminAiModelSecretSummary,
  AdminModelConfigResponse
} from "@/server/admin/model-config-service";

type Provider = AdminAiModelProfileSummary["provider"];
type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

type ProfileFormState = {
  profileId: string | null;
  name: string;
  provider: Provider;
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  enabled: boolean;
  keyMode: "none" | "env" | "secret";
  apiKeyEnvName: "LIGHTQUANT_AI_API_KEY" | "DEEPSEEK_API_KEY";
  apiKeySecretId: string;
};

type SecretFormState = {
  secretId: string;
  name: string;
  provider: "" | Provider;
  apiKey: string;
};

const emptyProfileForm: ProfileFormState = {
  profileId: null,
  name: "",
  provider: "openai_compatible",
  baseUrl: "",
  model: "",
  supportsVision: false,
  enabled: false,
  keyMode: "secret",
  apiKeyEnvName: "LIGHTQUANT_AI_API_KEY",
  apiKeySecretId: ""
};

const emptySecretForm: SecretFormState = {
  secretId: "",
  name: "",
  provider: "openai_compatible",
  apiKey: ""
};

const controlClass = "w-full rounded-md border border-steel/40 bg-paper px-sm py-xs text-caption-md text-ink outline-none transition-colors focus:border-primary disabled:bg-surface-container disabled:text-outline";

export function ModelConfigCenter({ data }: { data: AdminModelConfigResponse }) {
  const [profiles, setProfiles] = useState(data.profiles);
  const [secrets, setSecrets] = useState(data.secrets);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(emptyProfileForm);
  const [secretForm, setSecretForm] = useState<SecretFormState>(emptySecretForm);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canWrite = data.writeGuards.adminWriteEnabled && data.writeGuards.modelConfigWriteEnabled;
  const canSaveSecret = canWrite && data.writeGuards.configEncryptionConfigured;
  const activeProfile = useMemo(() => profiles.find((profile) => profile.active), [profiles]);

  async function refreshAfterWrite(successMessage: string) {
    const response = await fetch("/api/v1/admin/model-config", {
      cache: "no-store"
    });
    const payload = await response.json() as ApiResult<AdminModelConfigResponse>;

    if (!payload.success || !payload.data) {
      throw new Error(payload.error?.message ?? "刷新模型配置失败");
    }

    setProfiles(payload.data.profiles);
    setSecrets(payload.data.secrets);
    setMessage(successMessage);
  }

  async function createDefaults() {
    if (!confirm("创建默认模型 Profile？不会自动启用或切换。")) {
      return;
    }

    await runAction(async () => {
      await requestJson("/api/v1/admin/model-config/profiles/defaults", {});
      await refreshAfterWrite("默认模型 Profile 已创建");
    });
  }

  async function saveSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      await requestJson("/api/v1/admin/model-config/secrets", {
        secretId: secretForm.secretId || undefined,
        name: secretForm.name,
        provider: secretForm.provider || undefined,
        apiKey: secretForm.apiKey
      });
      setSecretForm(emptySecretForm);
      await refreshAfterWrite("模型 API Key 已保存");
    });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAction(async () => {
      const body = {
        name: profileForm.name,
        provider: profileForm.provider,
        baseUrl: profileForm.baseUrl,
        model: profileForm.model,
        supportsVision: profileForm.supportsVision,
        enabled: profileForm.enabled,
        apiKeyEnvName: profileForm.keyMode === "env" ? profileForm.apiKeyEnvName : undefined,
        apiKeySecretId: profileForm.keyMode === "secret" ? profileForm.apiKeySecretId : undefined
      };
      const endpoint = profileForm.profileId
        ? `/api/v1/admin/model-config/profiles/${profileForm.profileId}`
        : "/api/v1/admin/model-config/profiles";
      const method = profileForm.profileId ? "PATCH" : "POST";

      await requestJson(endpoint, body, method);
      setProfileForm(emptyProfileForm);
      await refreshAfterWrite(profileForm.profileId ? "模型 Profile 已更新" : "模型 Profile 已创建");
    });
  }

  async function switchProfile(profile: AdminAiModelProfileSummary) {
    if (!confirm(`确认切换为 ${profile.name}？\nProvider: ${profile.provider}\nModel: ${profile.model}\nBase URL: ${profile.baseUrlHost}`)) {
      return;
    }

    await runAction(async () => {
      await requestJson("/api/v1/admin/model-config/active-profile", {
        profileId: profile.id
      });
      await refreshAfterWrite("当前生效模型已切换");
    });
  }

  async function setProfileEnabled(profile: AdminAiModelProfileSummary, enabled: boolean) {
    if (!enabled && !confirm(`确认禁用 ${profile.name}？`)) {
      return;
    }

    await runAction(async () => {
      await requestJson(`/api/v1/admin/model-config/profiles/${profile.id}/${enabled ? "enable" : "disable"}`, {});
      await refreshAfterWrite(enabled ? "模型 Profile 已启用" : "模型 Profile 已禁用");
    });
  }

  function editProfile(profile: AdminAiModelProfileSummary) {
    setProfileForm({
      profileId: profile.id,
      name: profile.name,
      provider: profile.provider,
      baseUrl: profile.baseUrl,
      model: profile.model,
      supportsVision: profile.supportsVision,
      enabled: profile.enabled,
      keyMode: profile.apiKeySecretId ? "secret" : profile.apiKeyEnvName ? "env" : "none",
      apiKeyEnvName: profile.apiKeyEnvName ?? "LIGHTQUANT_AI_API_KEY",
      apiKeySecretId: profile.apiKeySecretId ?? ""
    });
    setMessage(null);
  }

  function editSecret(secret: AdminAiModelSecretSummary) {
    setSecretForm({
      secretId: secret.id,
      name: secret.name,
      provider: secret.provider ?? "",
      apiKey: ""
    });
    setMessage(null);
  }

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setMessage(null);

    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-md">
      {message ? (
        <div className="rounded-md border border-steel/40 bg-paper px-md py-sm text-caption-md text-secondary">
          {message}
        </div>
      ) : null}

      <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
        <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
          <div>
            <h2 className="text-body-emphasis text-ink">模型 Profiles</h2>
            <p className="mt-xxs text-caption-md text-secondary">管理可切换的大模型配置。API Key 只显示绑定状态，不显示明文。</p>
          </div>
          <button
            className="rounded-md border border-steel/50 px-sm py-xs text-button-sm text-secondary hover:bg-surface-container disabled:opacity-50"
            disabled={!canWrite || busy}
            onClick={createDefaults}
            type="button"
          >
            创建默认 Profile
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-steel/40">
          <table className="min-w-full border-collapse text-left text-caption-md">
            <thead>
              <tr>
                <Th>名称</Th>
                <Th>Provider</Th>
                <Th>Model</Th>
                <Th>Base URL</Th>
                <Th>API Key</Th>
                <Th>状态</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {profiles.length === 0 ? (
                <tr>
                  <Td colSpan={7}>暂无数据库模型配置，当前使用环境变量配置。</Td>
                </tr>
              ) : profiles.map((profile) => (
                <tr key={profile.id}>
                  <Td>
                    <div className="font-semibold text-ink">{profile.name}</div>
                    {profile.active ? <div className="mt-xxs text-caption-sm text-emerald-700">当前生效</div> : null}
                  </Td>
                  <Td>{profile.provider}</Td>
                  <Td>{profile.model}</Td>
                  <Td>{profile.baseUrlHost}</Td>
                  <Td>{formatProfileKey(profile)}</Td>
                  <Td>{profile.enabled ? "已启用" : "未启用"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-xs">
                      <ActionButton disabled={!canWrite || busy} onClick={() => editProfile(profile)}>编辑</ActionButton>
                      <ActionButton disabled={!canWrite || busy || profile.enabled} onClick={() => setProfileEnabled(profile, true)}>启用</ActionButton>
                      <ActionButton disabled={!canWrite || busy || !profile.enabled || profile.active} onClick={() => setProfileEnabled(profile, false)}>禁用</ActionButton>
                      <ActionButton disabled={!canWrite || busy || !profile.enabled || profile.active} onClick={() => switchProfile(profile)}>切换</ActionButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="mt-md grid gap-sm rounded-lg border border-steel/30 bg-surface-container-low p-md md:grid-cols-2 xl:grid-cols-4" onSubmit={saveProfile}>
          <div className="md:col-span-2 xl:col-span-4">
            <h3 className="text-caption-bold text-ink">{profileForm.profileId ? "编辑 Profile" : "新增 Profile"}</h3>
          </div>
          <Field label="名称">
            <input className={controlClass} disabled={!canWrite || busy} required value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
          </Field>
          <Field label="Provider">
            <select className={controlClass} disabled={!canWrite || busy} value={profileForm.provider} onChange={(event) => setProfileForm({ ...profileForm, provider: event.target.value as Provider })}>
              <option value="openai_compatible">openai_compatible</option>
              <option value="deepseek">deepseek</option>
              <option value="mock">mock</option>
            </select>
          </Field>
          <Field label="Base URL">
            <input className={controlClass} disabled={!canWrite || busy} placeholder="https://..." required value={profileForm.baseUrl} onChange={(event) => setProfileForm({ ...profileForm, baseUrl: event.target.value })} />
          </Field>
          <Field label="Model">
            <input className={controlClass} disabled={!canWrite || busy} required value={profileForm.model} onChange={(event) => setProfileForm({ ...profileForm, model: event.target.value })} />
          </Field>
          <Field label="API Key 来源">
            <select className={controlClass} disabled={!canWrite || busy} value={profileForm.keyMode} onChange={(event) => setProfileForm({ ...profileForm, keyMode: event.target.value as ProfileFormState["keyMode"] })}>
              <option value="secret">数据库密钥</option>
              <option value="env">环境变量</option>
              <option value="none">无</option>
            </select>
          </Field>
          {profileForm.keyMode === "secret" ? (
            <Field label="数据库 API Key">
              <select className={controlClass} disabled={!canWrite || busy} required value={profileForm.apiKeySecretId} onChange={(event) => setProfileForm({ ...profileForm, apiKeySecretId: event.target.value })}>
                <option value="">选择已保存的 API Key</option>
                {secrets.map((secret) => (
                  <option key={secret.id} value={secret.id}>{secret.name}</option>
                ))}
              </select>
            </Field>
          ) : null}
          {profileForm.keyMode === "env" ? (
            <Field label="环境变量">
              <select className={controlClass} disabled={!canWrite || busy} value={profileForm.apiKeyEnvName} onChange={(event) => setProfileForm({ ...profileForm, apiKeyEnvName: event.target.value as ProfileFormState["apiKeyEnvName"] })}>
                <option value="LIGHTQUANT_AI_API_KEY">LIGHTQUANT_AI_API_KEY</option>
                <option value="DEEPSEEK_API_KEY">DEEPSEEK_API_KEY</option>
              </select>
            </Field>
          ) : null}
          <label className="flex items-center gap-xs text-caption-md text-secondary">
            <input disabled={!canWrite || busy} type="checkbox" checked={profileForm.supportsVision} onChange={(event) => setProfileForm({ ...profileForm, supportsVision: event.target.checked })} />
            支持 Vision
          </label>
          <label className="flex items-center gap-xs text-caption-md text-secondary">
            <input disabled={!canWrite || busy} type="checkbox" checked={profileForm.enabled} onChange={(event) => setProfileForm({ ...profileForm, enabled: event.target.checked })} />
            创建后启用
          </label>
          <div className="flex gap-xs md:col-span-2 xl:col-span-4">
            <button className="rounded-md bg-primary px-md py-xs text-button-md text-on-primary disabled:opacity-50" disabled={!canWrite || busy} type="submit">
              {profileForm.profileId ? "保存 Profile" : "新增 Profile"}
            </button>
            {profileForm.profileId ? (
              <button className="rounded-md border border-steel/50 px-md py-xs text-button-md text-secondary" disabled={busy} onClick={() => setProfileForm(emptyProfileForm)} type="button">
                取消编辑
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
        <div className="mb-sm">
          <h2 className="text-body-emphasis text-ink">模型 API Keys</h2>
          <p className="mt-xxs text-caption-md text-secondary">只支持新增或覆盖更新，不展示旧 Key 明文。</p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-steel/40">
          <table className="min-w-full border-collapse text-left text-caption-md">
            <thead>
              <tr>
                <Th>名称</Th>
                <Th>Provider</Th>
                <Th>配置状态</Th>
                <Th>更新时间</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody>
              {secrets.length === 0 ? (
                <tr>
                  <Td colSpan={5}>暂无数据库 API Key。</Td>
                </tr>
              ) : secrets.map((secret) => (
                <tr key={secret.id}>
                  <Td>{secret.name}</Td>
                  <Td>{secret.provider ?? "-"}</Td>
                  <Td>已配置</Td>
                  <Td>{formatDate(secret.updatedAt)}</Td>
                  <Td>
                    <ActionButton disabled={!canSaveSecret || busy} onClick={() => editSecret(secret)}>更新 Key</ActionButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="mt-md grid gap-sm rounded-lg border border-steel/30 bg-surface-container-low p-md md:grid-cols-2 xl:grid-cols-4" onSubmit={saveSecret}>
          <div className="md:col-span-2 xl:col-span-4">
            <h3 className="text-caption-bold text-ink">{secretForm.secretId ? "更新 API Key" : "新增 API Key"}</h3>
          </div>
          <Field label="名称">
            <input className={controlClass} disabled={!canSaveSecret || busy} required value={secretForm.name} onChange={(event) => setSecretForm({ ...secretForm, name: event.target.value })} />
          </Field>
          <Field label="Provider">
            <select className={controlClass} disabled={!canSaveSecret || busy} value={secretForm.provider} onChange={(event) => setSecretForm({ ...secretForm, provider: event.target.value as SecretFormState["provider"] })}>
              <option value="">不限</option>
              <option value="openai_compatible">openai_compatible</option>
              <option value="deepseek">deepseek</option>
              <option value="mock">mock</option>
            </select>
          </Field>
          <Field label="API Key">
            <input className={controlClass} disabled={!canSaveSecret || busy} required type="password" value={secretForm.apiKey} onChange={(event) => setSecretForm({ ...secretForm, apiKey: event.target.value })} />
          </Field>
          <div className="flex items-end gap-xs">
            <button className="rounded-md bg-primary px-md py-xs text-button-md text-on-primary disabled:opacity-50" disabled={!canSaveSecret || busy} type="submit">
              {secretForm.secretId ? "覆盖保存" : "保存 API Key"}
            </button>
            {secretForm.secretId ? (
              <button className="rounded-md border border-steel/50 px-md py-xs text-button-md text-secondary" disabled={busy} onClick={() => setSecretForm(emptySecretForm)} type="button">
                取消
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
        <h2 className="mb-sm text-body-emphasis text-ink">密钥状态</h2>
        <div className="overflow-x-auto rounded-lg border border-steel/40">
          <table className="min-w-full border-collapse text-left text-caption-md">
            <thead>
              <tr>
                <Th>配置项</Th>
                <Th>是否配置</Th>
                <Th>格式状态</Th>
                <Th>来源</Th>
                <Th>提示</Th>
              </tr>
            </thead>
            <tbody>
              {data.keyStatuses.map((item) => (
                <tr key={item.name}>
                  <Td>{item.name}</Td>
                  <Td>{item.configured ? "是" : "否"}</Td>
                  <Td>{formatSecretFormat(item.formatValid)}</Td>
                  <Td>{item.source}</Td>
                  <Td>{item.hint}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function requestJson(endpoint: string, body: Record<string, unknown>, method = "POST") {
  const response = await fetch(endpoint, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json() as ApiResult<unknown>;

  if (!payload.success) {
    throw new Error(payload.error?.message ?? "请求失败");
  }

  return payload.data;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-xxs text-caption-md text-secondary">
      <span className="block">{label}</span>
      {children}
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap border-b border-steel/40 bg-surface-container-low px-sm py-xs text-caption-bold text-secondary">{children}</th>;
}

function Td({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return <td className="max-w-[320px] whitespace-nowrap border-b border-steel/20 px-sm py-xs align-top text-secondary" colSpan={colSpan}>{children}</td>;
}

function ActionButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      className="rounded-md border border-steel/50 px-xs py-xxs text-caption-bold text-secondary hover:bg-surface-container disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function formatProfileKey(profile: AdminAiModelProfileSummary) {
  if (profile.provider === "mock") {
    return "无需 Key";
  }

  if (profile.apiKeySource === "database secret") {
    return profile.apiKeyConfigured ? "数据库密钥" : "数据库密钥缺失";
  }

  if (profile.apiKeySource === "env") {
    return profile.apiKeyConfigured ? `环境变量 ${profile.apiKeyEnvName}` : `环境变量缺失`;
  }

  return "未绑定";
}

function formatSecretFormat(value: boolean | "unknown") {
  if (value === "unknown") {
    return "未知";
  }

  return value ? "通过" : "未通过";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
