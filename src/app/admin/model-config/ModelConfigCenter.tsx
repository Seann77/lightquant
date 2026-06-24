"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  AdminAiModelProfileSummary,
  AdminAiModelSecretSummary,
  AdminModelConfigResponse
} from "@/server/admin/model-config-service";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

type ProfileForm = {
  id: string | null;
  name: string;
  provider: "mock" | "deepseek" | "openai_compatible";
  baseUrl: string;
  model: string;
  supportsVision: boolean;
  enabled: boolean;
  keyBinding: string;
};

type SecretForm = {
  id: string;
  name: string;
  provider: "" | "mock" | "deepseek" | "openai_compatible";
  apiKey: string;
};

const ENV_KEY_OPTIONS = ["LIGHTQUANT_AI_API_KEY", "DEEPSEEK_API_KEY"];

export function ModelConfigCenter({ data }: { data: AdminModelConfigResponse }) {
  const writeDisabled = !data.writeGuards.adminWriteEnabled || !data.writeGuards.modelConfigWriteEnabled;
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(() => emptyProfileForm());
  const [secretForm, setSecretForm] = useState<SecretForm>(() => emptySecretForm());

  const profileOptions = useMemo(() => data.profiles, [data.profiles]);
  const secretOptions = useMemo(() => data.secrets, [data.secrets]);

  async function submitProfile() {
    const body = profileFormToPayload(profileForm);
    const editing = Boolean(profileForm.id);
    await runMutation(
      editing
        ? `/api/v1/admin/model-config/profiles/${profileForm.id}`
        : "/api/v1/admin/model-config/profiles",
      editing ? "PATCH" : "POST",
      body,
      editing ? "Profile 已更新" : "Profile 已创建"
    );
  }

  async function submitSecret() {
    await runMutation("/api/v1/admin/model-config/secrets", "POST", {
      id: secretForm.id || undefined,
      name: secretForm.name,
      provider: secretForm.provider || undefined,
      apiKey: secretForm.apiKey
    }, secretForm.id ? "API Key 已更新" : "API Key 已创建");
  }

  async function seedDefaultProfiles() {
    if (!window.confirm("确认创建默认 MIMO / DeepSeek Profiles？默认不会包含 API Key，也不会自动启用。")) {
      return;
    }

    await runMutation("/api/v1/admin/model-config/profiles/defaults", "POST", {}, "默认 Profiles 已创建");
  }

  async function switchProfile(profile: AdminAiModelProfileSummary) {
    if (!window.confirm(`确认切换当前生效 Profile 为 ${profile.name}？新 AI 任务将使用该配置。`)) {
      return;
    }

    await runMutation("/api/v1/admin/model-config/active-profile", "POST", {
      profileId: profile.id
    }, "当前生效 Profile 已切换");
  }

  async function setProfileEnabled(profile: AdminAiModelProfileSummary, enabled: boolean) {
    if (!enabled && !window.confirm(`确认停用 Profile：${profile.name}？`)) {
      return;
    }

    await runMutation(
      `/api/v1/admin/model-config/profiles/${profile.id}/${enabled ? "enable" : "disable"}`,
      "POST",
      {},
      enabled ? "Profile 已启用" : "Profile 已停用"
    );
  }

  async function runMutation(path: string, method: "POST" | "PATCH", body: Record<string, unknown>, successMessage: string) {
    if (writeDisabled) {
      setState({ status: "error", message: "模型配置写操作未开启" });
      return;
    }

    setSubmitting(true);
    setState({ status: "idle", message: "" });

    try {
      const response = await fetch(path, {
        method,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "操作失败");
      }

      setState({ status: "success", message: successMessage });
      setSecretForm(emptySecretForm());
      setProfileForm(emptyProfileForm());
      window.location.reload();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "操作失败"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-md">
      <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <div>
            <h2 className="text-body-emphasis text-ink">模型 Profiles</h2>
            <p className="mt-xxs text-caption-md text-secondary">新增、编辑、启用、停用和切换当前生效模型配置。</p>
          </div>
          <button
            className="h-10 rounded-md border border-steel/50 bg-paper px-md text-button-md text-secondary disabled:text-outline"
            disabled={writeDisabled || submitting || profileOptions.length > 0}
            onClick={seedDefaultProfiles}
            type="button"
          >
            创建默认 Profiles
          </button>
        </div>

        <div className="mt-md grid gap-sm xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-caption-md">
              <thead>
                <tr className="text-secondary">
                  <Th>Name</Th>
                  <Th>Provider / Model</Th>
                  <Th>Base URL</Th>
                  <Th>Key</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {profileOptions.length === 0 ? (
                  <tr>
                    <Td colSpan={7}>暂无数据库模型配置，当前使用环境变量配置。</Td>
                  </tr>
                ) : profileOptions.map((profile) => (
                  <tr key={profile.id}>
                    <Td>
                      <div className="font-semibold text-ink">{profile.name}</div>
                      {profile.errorHint ? <div className="mt-xxs max-w-[220px] text-bloom-deep">{profile.errorHint}</div> : null}
                    </Td>
                    <Td>
                      <div className="text-ink">{profile.provider}</div>
                      <div className="text-secondary">{profile.model}</div>
                    </Td>
                    <Td>
                      <span className="block max-w-[220px] truncate text-ink">{profile.baseUrlHost}</span>
                    </Td>
                    <Td>{formatProfileKey(profile)}</Td>
                    <Td>
                      <StatusBadge profile={profile} />
                    </Td>
                    <Td>{formatDate(profile.updatedAt)}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-xs">
                        <SmallButton disabled={writeDisabled || submitting} onClick={() => setProfileForm(profileToForm(profile))}>编辑</SmallButton>
                        <SmallButton disabled={writeDisabled || submitting || profile.active || !profile.enabled || !profile.configValid} onClick={() => switchProfile(profile)}>切换</SmallButton>
                        {profile.enabled ? (
                          <SmallButton disabled={writeDisabled || submitting || profile.active} onClick={() => setProfileEnabled(profile, false)}>停用</SmallButton>
                        ) : (
                          <SmallButton disabled={writeDisabled || submitting || !profile.apiKeyConfigured && profile.provider !== "mock"} onClick={() => setProfileEnabled(profile, true)}>启用</SmallButton>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-md border border-steel/30 bg-surface-container-low p-sm">
            <h3 className="text-body-md font-semibold text-ink">{profileForm.id ? "编辑 Profile" : "新增 Profile"}</h3>
            <div className="mt-sm grid gap-xs">
              <TextInput disabled={writeDisabled || submitting} label="Name" value={profileForm.name} onChange={(value) => setProfileForm({ ...profileForm, name: value })} />
              <SelectInput
                disabled={writeDisabled || submitting}
                label="Provider"
                value={profileForm.provider}
                options={[
                  ["openai_compatible", "openai_compatible"],
                  ["deepseek", "deepseek"],
                  ["mock", "mock"]
                ]}
                onChange={(value) => setProfileForm({ ...profileForm, provider: value as ProfileForm["provider"] })}
              />
              <TextInput disabled={writeDisabled || submitting} label="Base URL" value={profileForm.baseUrl} onChange={(value) => setProfileForm({ ...profileForm, baseUrl: value })} />
              <TextInput disabled={writeDisabled || submitting} label="Model" value={profileForm.model} onChange={(value) => setProfileForm({ ...profileForm, model: value })} />
              <SelectInput
                disabled={writeDisabled || submitting}
                label="API Key"
                value={profileForm.keyBinding}
                options={[
                  ["", "不绑定"],
                  ...ENV_KEY_OPTIONS.map((name) => [`env:${name}`, `Env: ${name}`] as [string, string]),
                  ...secretOptions.map((secret) => [`secret:${secret.id}`, `Secret: ${secret.name}`] as [string, string])
                ]}
                onChange={(value) => setProfileForm({ ...profileForm, keyBinding: value })}
              />
              <label className="flex items-center gap-xs text-caption-md text-secondary">
                <input
                  checked={profileForm.supportsVision}
                  disabled={writeDisabled || submitting}
                  onChange={(event) => setProfileForm({ ...profileForm, supportsVision: event.target.checked })}
                  type="checkbox"
                />
                支持 vision
              </label>
              <label className="flex items-center gap-xs text-caption-md text-secondary">
                <input
                  checked={profileForm.enabled}
                  disabled={writeDisabled || submitting}
                  onChange={(event) => setProfileForm({ ...profileForm, enabled: event.target.checked })}
                  type="checkbox"
                />
                启用 Profile
              </label>
            </div>
            <div className="mt-sm flex flex-wrap gap-sm">
              <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper" disabled={writeDisabled || submitting} onClick={submitProfile} type="button">
                {profileForm.id ? "保存 Profile" : "新增 Profile"}
              </button>
              <button className="h-10 rounded-md border border-steel/50 bg-paper px-md text-button-md text-secondary disabled:text-outline" disabled={submitting} onClick={() => setProfileForm(emptyProfileForm())} type="button">
                清空
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm">
        <div>
          <h2 className="text-body-emphasis text-ink">模型 API Keys</h2>
          <p className="mt-xxs text-caption-md text-secondary">只保存加密后的模型 Key；旧 Key 不可查看，提交后输入框会清空。</p>
        </div>

        <div className="mt-md grid gap-sm xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-caption-md">
              <thead>
                <tr className="text-secondary">
                  <Th>Name</Th>
                  <Th>Provider</Th>
                  <Th>Configured</Th>
                  <Th>Updated</Th>
                  <Th>Action</Th>
                </tr>
              </thead>
              <tbody>
                {secretOptions.length === 0 ? (
                  <tr>
                    <Td colSpan={5}>暂无数据库模型 API Key。可以继续使用环境变量 Key。</Td>
                  </tr>
                ) : secretOptions.map((secret) => (
                  <tr key={secret.id}>
                    <Td>{secret.name}</Td>
                    <Td>{secret.provider ?? "-"}</Td>
                    <Td>{secret.configured ? "已配置" : "未配置"}</Td>
                    <Td>{formatDate(secret.updatedAt)}</Td>
                    <Td>
                      <SmallButton disabled={writeDisabled || submitting} onClick={() => setSecretForm(secretToForm(secret))}>更新 Key</SmallButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-sm grid gap-xs rounded-md border border-steel/30 bg-surface-container-low p-sm text-caption-md text-secondary md:grid-cols-3">
              {data.keyStatuses.map((item) => (
                <div key={item.name}>
                  <div className="font-semibold text-ink">{item.name}</div>
                  <div>{item.configured ? "已配置" : "未配置"}</div>
                  <div>{item.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-steel/30 bg-surface-container-low p-sm">
            <h3 className="text-body-md font-semibold text-ink">{secretForm.id ? "更新 API Key" : "新增 API Key"}</h3>
            <div className="mt-sm grid gap-xs">
              <SelectInput
                disabled={writeDisabled || submitting}
                label="更新已有 Key"
                value={secretForm.id}
                options={[
                  ["", "新建 Key"],
                  ...secretOptions.map((secret) => [secret.id, secret.name] as [string, string])
                ]}
                onChange={(value) => {
                  const matched = secretOptions.find((secret) => secret.id === value);
                  setSecretForm(matched ? secretToForm(matched) : emptySecretForm());
                }}
              />
              <TextInput disabled={writeDisabled || submitting} label="Name" value={secretForm.name} onChange={(value) => setSecretForm({ ...secretForm, name: value })} />
              <SelectInput
                disabled={writeDisabled || submitting}
                label="Provider"
                value={secretForm.provider}
                options={[
                  ["", "不指定"],
                  ["openai_compatible", "openai_compatible"],
                  ["deepseek", "deepseek"],
                  ["mock", "mock"]
                ]}
                onChange={(value) => setSecretForm({ ...secretForm, provider: value as SecretForm["provider"] })}
              />
              <PasswordInput disabled={writeDisabled || submitting} label="New API Key" value={secretForm.apiKey} onChange={(value) => setSecretForm({ ...secretForm, apiKey: value })} />
            </div>
            <div className="mt-sm flex flex-wrap gap-sm">
              <button className="h-10 rounded-md bg-primary px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper" disabled={writeDisabled || submitting || !data.writeGuards.configEncryptionConfigured} onClick={submitSecret} type="button">
                {secretForm.id ? "更新 Key" : "保存 Key"}
              </button>
              <button className="h-10 rounded-md border border-steel/50 bg-paper px-md text-button-md text-secondary disabled:text-outline" disabled={submitting} onClick={() => setSecretForm(emptySecretForm())} type="button">
                清空
              </button>
            </div>
          </div>
        </div>
      </section>

      {state.message ? (
        <div className={state.status === "success" ? "text-caption-md text-emerald-700" : "text-caption-md text-bloom-deep"}>
          {state.message}
        </div>
      ) : null}
    </div>
  );
}

function emptyProfileForm(): ProfileForm {
  return {
    id: null,
    name: "",
    provider: "openai_compatible",
    baseUrl: "https://token-plan-cn.xiaomimimo.com/v1",
    model: "mimo-v2.5-pro",
    supportsVision: false,
    enabled: false,
    keyBinding: ""
  };
}

function emptySecretForm(): SecretForm {
  return {
    id: "",
    name: "",
    provider: "openai_compatible",
    apiKey: ""
  };
}

function profileToForm(profile: AdminAiModelProfileSummary): ProfileForm {
  return {
    id: profile.id,
    name: profile.name,
    provider: profile.provider,
    baseUrl: profile.baseUrl,
    model: profile.model,
    supportsVision: profile.supportsVision,
    enabled: profile.enabled,
    keyBinding: profile.apiKeySecretId ? `secret:${profile.apiKeySecretId}` : profile.apiKeyEnvName ? `env:${profile.apiKeyEnvName}` : ""
  };
}

function secretToForm(secret: AdminAiModelSecretSummary): SecretForm {
  return {
    id: secret.id,
    name: secret.name,
    provider: secret.provider ?? "",
    apiKey: ""
  };
}

function profileFormToPayload(form: ProfileForm) {
  const apiKeyEnvName = form.keyBinding.startsWith("env:") ? form.keyBinding.slice(4) : null;
  const apiKeySecretId = form.keyBinding.startsWith("secret:") ? form.keyBinding.slice(7) : null;

  return {
    name: form.name,
    provider: form.provider,
    baseUrl: form.baseUrl,
    model: form.model,
    supportsVision: form.supportsVision,
    enabled: form.enabled,
    apiKeyEnvName,
    apiKeySecretId
  };
}

function formatProfileKey(profile: AdminAiModelProfileSummary) {
  if (profile.provider === "mock") {
    return "不需要";
  }

  if (profile.keySource === "database secret") {
    return profile.apiKeyConfigured ? `Secret: ${profile.apiKeySecretName ?? "已绑定"}` : "Secret 缺失";
  }

  if (profile.keySource === "env") {
    return profile.apiKeyConfigured ? `Env: ${profile.apiKeyEnvName}` : `Env 未配置: ${profile.apiKeyEnvName}`;
  }

  return "未绑定";
}

function StatusBadge({ profile }: { profile: AdminAiModelProfileSummary }) {
  const text = profile.active ? "当前生效" : profile.enabled ? "已启用" : "已停用";
  const tone = profile.active
    ? "bg-emerald-50 text-emerald-700"
    : profile.enabled
      ? "bg-surface-container text-secondary"
      : "bg-error-container/30 text-bloom-deep";

  return <span className={`rounded-full px-xs py-[2px] text-caption-sm ${tone}`}>{text}</span>;
}

function TextInput({ disabled, label, value, onChange }: { disabled: boolean; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-xxs text-caption-md text-secondary">
      {label}
      <input
        className="h-10 rounded-md border border-steel/40 bg-paper px-sm text-body-md text-ink outline-none focus:border-primary disabled:text-outline"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function PasswordInput({ disabled, label, value, onChange }: { disabled: boolean; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-xxs text-caption-md text-secondary">
      {label}
      <input
        className="h-10 rounded-md border border-steel/40 bg-paper px-sm text-body-md text-ink outline-none focus:border-primary disabled:text-outline"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        type="password"
        value={value}
      />
    </label>
  );
}

function SelectInput({
  disabled,
  label,
  value,
  options,
  onChange
}: {
  disabled: boolean;
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-xxs text-caption-md text-secondary">
      {label}
      <select
        className="h-10 rounded-md border border-steel/40 bg-paper px-sm text-body-md text-ink outline-none focus:border-primary disabled:text-outline"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue || "empty"} value={optionValue}>{labelText}</option>
        ))}
      </select>
    </label>
  );
}

function SmallButton({ children, disabled, onClick }: { children: ReactNode; disabled: boolean; onClick: () => void }) {
  return (
    <button
      className="h-8 rounded-md border border-steel/50 bg-paper px-sm text-caption-md text-secondary disabled:text-outline"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="border-b border-steel/30 px-sm py-xs font-semibold">{children}</th>;
}

function Td({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return <td className="border-b border-steel/20 px-sm py-xs align-top text-secondary" colSpan={colSpan}>{children}</td>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
