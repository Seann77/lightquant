"use client";

import { useState } from "react";
import type { AdminAiModelProfileSummary } from "@/server/admin/model-config-service";

type SubmitState =
  | { status: "idle"; message: "" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function ModelProfileSwitcher({
  profiles,
  disabled
}: {
  profiles: AdminAiModelProfileSummary[];
  disabled: boolean;
}) {
  const [pendingProfile, setPendingProfile] = useState<AdminAiModelProfileSummary | null>(null);
  const [state, setState] = useState<SubmitState>({ status: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function switchProfile(profile: AdminAiModelProfileSummary) {
    setSubmitting(true);
    setState({ status: "idle", message: "" });

    try {
      const response = await fetch("/api/v1/admin/model-config/active-profile", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          profileId: profile.id
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "模型配置切换失败");
      }

      setState({ status: "success", message: "模型配置已切换" });
      setPendingProfile(null);
      window.location.reload();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "模型配置切换失败"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-sm">
      {profiles.length === 0 ? (
        <div className="rounded-lg border border-steel/40 bg-paper p-md text-caption-md text-secondary shadow-sm">
          暂无数据库模型配置，当前使用环境变量配置。
        </div>
      ) : (
        <div className="grid gap-sm lg:grid-cols-2">
          {profiles.map((profile) => (
            <article className="rounded-lg border border-steel/40 bg-paper p-md shadow-sm" key={profile.id}>
              <div className="flex flex-wrap items-start justify-between gap-sm">
                <div>
                  <div className="text-body-emphasis text-ink">{profile.name}</div>
                  <div className="mt-xxs text-caption-sm text-secondary">{profile.provider} / {profile.model}</div>
                </div>
                <span className={`rounded-full px-xs py-[2px] text-caption-sm ${profile.active ? "bg-emerald-50 text-emerald-700" : "bg-surface-container text-secondary"}`}>
                  {profile.active ? "当前生效" : profile.enabled ? "可用" : "停用"}
                </span>
              </div>
              <dl className="mt-sm grid gap-xs text-caption-md text-secondary">
                <div className="flex justify-between gap-sm">
                  <dt>baseUrl</dt>
                  <dd className="truncate text-ink">{profile.baseUrlHost}</dd>
                </div>
                <div className="flex justify-between gap-sm">
                  <dt>Vision</dt>
                  <dd className="text-ink">{profile.supportsVision ? "支持" : "不支持"}</dd>
                </div>
                <div className="flex justify-between gap-sm">
                  <dt>API Key</dt>
                  <dd className="text-ink">{profile.apiKeyConfigured ? "已配置" : "未配置"}</dd>
                </div>
              </dl>
              <button
                className="mt-sm h-10 rounded-md bg-primary px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper"
                disabled={disabled || submitting || profile.active || !profile.enabled}
                onClick={() => {
                  setPendingProfile(profile);
                  setState({ status: "idle", message: "" });
                }}
                type="button"
              >
                切换为此配置
              </button>
            </article>
          ))}
        </div>
      )}

      {pendingProfile ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-md py-sm text-caption-md text-amber-900">
          <div className="text-caption-bold">确认切换模型配置</div>
          <div className="mt-xs grid gap-xxs">
            <div>目标配置：{pendingProfile.name}</div>
            <div>Provider：{pendingProfile.provider}</div>
            <div>Model：{pendingProfile.model}</div>
            <div>Base URL：{pendingProfile.baseUrlHost}</div>
          </div>
          <div className="mt-sm flex flex-wrap gap-sm">
            <button
              className="h-10 rounded-md bg-bloom px-md text-button-md text-on-primary disabled:bg-outline disabled:text-paper"
              disabled={submitting}
              onClick={() => switchProfile(pendingProfile)}
              type="button"
            >
              {submitting ? "切换中" : "确认切换"}
            </button>
            <button
              className="h-10 rounded-md border border-steel/50 bg-paper px-md text-button-md text-secondary disabled:text-outline"
              disabled={submitting}
              onClick={() => setPendingProfile(null)}
              type="button"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}

      {state.message ? (
        <div className={state.status === "success" ? "text-caption-md text-emerald-700" : "text-caption-md text-bloom-deep"}>
          {state.message}
        </div>
      ) : null}
    </div>
  );
}
