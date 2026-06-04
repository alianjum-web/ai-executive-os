import { ChatWindow } from "@/chat/organisms/ChatWindow";
import { DashboardTemplate } from "@/common/organisms/DashboardTemplate";

export function ChatScreen() {
  return (
    <DashboardTemplate title="Knowledge chat">
      <ChatWindow />
    </DashboardTemplate>
  );
}
