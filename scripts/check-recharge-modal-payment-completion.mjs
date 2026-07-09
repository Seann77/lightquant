import { readFileSync } from "node:fs";

const path = "src/components/shell/RechargeModal.tsx";
const source = readFileSync(path, "utf8");
const failures = [];

requireSnippet("tracks server-confirmed credit grant", "paidCreditGrantedOrderId");
requireSnippet("records paid and creditGranted status", "payload.data.payment.paid && payload.data.payment.creditGranted");
requireSnippet("marks the credited order", "setPaidCreditGrantedOrderId(payload.data.order.id)");
requireSnippet("keeps duplicate-settlement guard", "settledOrderRef.current !== payload.data.order.id");
requireSnippet("has completion handler", "async function handleCompletePaidPayment()");
requireSnippet("completion refreshes user credits", "await onRechargeSuccess();");
requireSnippet("completion dispatches credits update", 'window.dispatchEvent(new Event("lightquant:credits-updated"));');
requireSnippet("completion closes modal", "onClose();");
requireSnippet("monthly success copy", "月卡已开通，积分已到账。");
requireSnippet("active monthly card error copy", "当前已有有效月卡，到期后可重新购买。");
requireSnippet("pending real payments still refresh status", 'const canRefreshPayment = Boolean(orderData && pendingOrder && paymentAction && paymentAction.type !== "mock");');
requireSnippet("paid completion button is rendered first", "{canCompletePaidPayment ? (");
requireSnippet("paid completion button is clickable", "onClick={() => void handleCompletePaidPayment()}");
requireSnippet("paid completion button is not disabled by paid", "disabled={completingPayment}");

requireSnippet("modal title", "积分充值");
requireSnippet("plan group title", 'title="基础积分包"');
requireSnippet("plan group note", 'note="基础积分长期有效"');
requireSnippet("monthly group title", 'title="月卡"');
requireSnippet("monthly group note", 'note="月卡积分 30 天内有效"');
requireSnippet("package three-column plan grid", "md:grid-cols-3");
requireSnippet("monthly two-column plan grid", "md:grid-cols-2");
requireSnippet("shared fixed plan card height", "h-[116px]");
requireSnippet("monthly validity shares the points row", "flex items-center justify-between gap-xs");
requireSnippet("monthly validity pill stays inline", "inline-flex shrink-0 rounded-full");
requireSnippet("two-column full-width payment grid", "grid w-full grid-cols-2 gap-sm");
requireSnippet("promo limit badge", "限购一次");
requireSnippet("promo purchased badge", "已购买");
requireSnippet("monthly plus recommendation", "推荐");
requireSnippet("monthly validity label", "30 天内有效");
requireSnippet("wechat disabled fallback", '{ id: "wechat", icon: paymentMethodMeta.wechat.icon, label: paymentMethodMeta.wechat.label, enabled: false }');
requireSnippet("single remaining rule copy", "月卡积分优先消耗，基础积分长期有效。");

requireOrdered(
  "PENDING refresh branch remains before generic create-order branch",
  "canRefreshPayment ? (",
  "onClick={() => void refreshPaymentStatus(true)}",
  "disabled={loadingPlans || creatingOrder || !activePlan || !activePaymentEnabled || activePlanDisabled || paid}"
);

requireOrdered(
  "PAID completion branch wins before PENDING refresh branch",
  "{canCompletePaidPayment ? (",
  "handleCompletePaidPayment",
  "canRefreshPayment ? ("
);

forbidSnippet("return_url/paymentReturn must not be used as credit-grant proof in RechargeModal", "paymentReturn");
forbidSnippet("old permanent group title must not be shown", "永久积分包");
forbidSnippet("old credit package points copy must not be shown", "积分包积分");
forbidSnippet("must not show per-100-points copy", "每 100");
forbidSnippet("must not show expiration clearing copy", "到期清零");
forbidSnippet("must not show feature consumption copy", "功能消耗");
forbidSnippet("permanent cards must not show long-valid copy", "不会清零");
forbidSnippet("monthly validity must not occupy its old bottom row", "mt-auto inline-flex w-fit");

if (failures.length > 0) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        path,
        failures
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} else {
  console.log(
    JSON.stringify(
      {
        ok: true,
        path,
        coveredFlow: "final recharge modal copy/layout plus server-confirmed payment completion"
      },
      null,
      2
    )
  );
}

function requireSnippet(label, snippet) {
  if (!source.includes(snippet)) {
    failures.push(`${label}: missing ${JSON.stringify(snippet)}`);
  }
}

function forbidSnippet(label, snippet) {
  if (source.includes(snippet)) {
    failures.push(`${label}: found forbidden ${JSON.stringify(snippet)}`);
  }
}

function requireOrdered(label, ...snippets) {
  let cursor = -1;

  for (const snippet of snippets) {
    const index = source.indexOf(snippet, cursor + 1);

    if (index < 0) {
      failures.push(`${label}: missing ${JSON.stringify(snippet)} after index ${cursor}`);
      return;
    }

    cursor = index;
  }
}
