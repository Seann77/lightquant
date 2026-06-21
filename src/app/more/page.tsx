import { MoreClient } from "@/app/more/MoreClient";
import { isPaymentFeatureEnabled } from "@/server/env";

export const metadata = {
  title: "更多信息与支持 - LightQuant 轻量化"
};

export default function MorePage() {
  return <MoreClient paymentFeatureEnabled={isPaymentFeatureEnabled()} />;
}
