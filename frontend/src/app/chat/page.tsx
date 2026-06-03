import { ChatWindow } from "@/components/organisms/ChatWindow";
import { DashboardTemplate } from "@/components/templates/DashboardTemplate";

export default function ChatPage() {
  return (
    <DashboardTemplate title="Knowledge Chat">
      <div className="h-[calc(100vh-12rem)]">
        <ChatWindow />
      </div>
    </DashboardTemplate>
  );
}
