import { LegalDocumentPage } from "@/app/legal/LegalDocumentPage";

export const metadata = {
  title: "用户协议 - LightQuant 轻量化"
};

export default function UserAgreementPage() {
  return <LegalDocumentPage fileName="user-agreement.md" />;
}
