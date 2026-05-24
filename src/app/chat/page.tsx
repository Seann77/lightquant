import { ChatClient } from "@/app/chat/ChatClient";

type ChatPageProps = {
  searchParams: Promise<{
    mode?: string;
  }>;
};

export const metadata = {
  title: "对话页 - LightQuant 轻量化"
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const { mode } = await searchParams;

  return <ChatClient mode={mode === "convert" ? "convert" : "strategy"} />;
}

