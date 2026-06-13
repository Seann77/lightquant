import { LegalDocumentPage } from "@/app/legal/LegalDocumentPage";

export const metadata = {
  title: "隐私政策 - LightQuant 轻量化"
};

export default function PrivacyPolicyPage() {
  return <LegalDocumentPage fileName="privacy-policy.md" />;
}
