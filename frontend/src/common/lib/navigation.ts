import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Ticket,
} from "lucide-react";
import type { FeatureFlag } from "@/common/config";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  flag?: FeatureFlag;
};

export const primaryNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Command Center",
    description: "What needs attention",
    icon: LayoutDashboard,
  },
  {
    href: "/chat",
    label: "AI Assistant",
    description: "Ask your knowledge base",
    icon: MessageSquare,
    flag: "KNOWLEDGE_AGENT_ENABLED",
  },
  {
    href: "/knowledge",
    label: "Knowledge",
    description: "Documents & SOPs",
    icon: BookOpen,
    flag: "DOCUMENT_UPLOAD_ENABLED",
    adminOnly: true,
  },
  {
    href: "/tickets",
    label: "Tasks",
    description: "Routing & assignments",
    icon: Ticket,
    flag: "PROJECT_AGENT_ENABLED",
  },
];

export const secondaryNav: NavItem[] = [
  {
    href: "/dashboard",
    label: "Analytics",
    description: "Usage & performance",
    icon: BarChart3,
    flag: "ANALYTICS_DASHBOARD_ENABLED",
    adminOnly: true,
  },
];
