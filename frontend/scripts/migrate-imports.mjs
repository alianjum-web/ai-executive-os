import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");
const dirs = ["modules", "services", "store", "app", "lib", "config"];
const exts = [".ts", ".tsx"];

const replacements = [
  [/@\/components\/ui\//g, "@/common/atoms/ui/"],
  [/@\/components\/atoms\//g, "@/common/atoms/"],
  [/@\/components\/states\//g, "@/common/molecules/"],
  [/@\/components\/brand\//g, "@/common/atoms/"],
  [/@\/components\/guards\//g, "@/common/organisms/"],
  [/@\/components\/providers\//g, "@/common/organisms/providers/"],
  [/@\/components\/layout\//g, "@/common/organisms/layout/"],
  [/@\/components\/templates\//g, "@/common/organisms/templates/"],
  [/@\/components\/auth\//g, "@/auth/organisms/"],
  [/@\/components\/dashboard\//g, "@/dashboard/organisms/"],
  [/@\/components\/molecules\/ChatBubble/g, "@/chat/molecules/ChatBubble"],
  [/@\/components\/molecules\/CitationCard/g, "@/chat/molecules/CitationCard"],
  [/@\/components\/molecules\/FileUploadCard/g, "@/knowledge/molecules/FileUploadCard"],
  [/@\/components\/molecules\/TicketRow/g, "@/tickets/molecules/TicketRow"],
  [/@\/components\/organisms\/ChatWindow/g, "@/chat/organisms/ChatWindow"],
  [/@\/components\/organisms\/DocumentLibrary/g, "@/knowledge/organisms/DocumentLibrary"],
  [/@\/components\/organisms\/TicketFeed/g, "@/tickets/organisms/TicketFeed"],
  [/@\/components\/organisms\/MetricsDashboard/g, "@/dashboard/organisms/MetricsDashboard"],
  [/@\/hooks\/useSidebar/g, "@/common/hooks/useSidebar"],
  [/@\/hooks\/useMobileNav/g, "@/common/hooks/useMobileNav"],
  [/@\/hooks\/useTheme/g, "@/common/hooks/useTheme"],
  [/@\/hooks\/useFeatureFlag/g, "@/common/hooks/useFeatureFlag"],
  [/@\/hooks\/useUser/g, "@/common/hooks/useUser"],
  [/@\/hooks\/useOrg/g, "@/common/hooks/useOrg"],
  [/@\/hooks\/useRole/g, "@/common/hooks/useRole"],
  [/@\/hooks\/useChat/g, "@/chat/hooks/useChat"],
  [/@\/hooks\/useQueryStream/g, "@/chat/hooks/useQueryStream"],
  [/@\/hooks\/useDocumentUpload/g, "@/knowledge/hooks/useDocumentUpload"],
  [/@\/hooks\/useTickets/g, "@/tickets/hooks/useTickets"],
  [/@\/store\/slices\/uiSlice/g, "@/common/state/slices/uiSlice"],
  [/@\/store\/slices\/userSlice/g, "@/common/state/slices/userSlice"],
  [/@\/store\/slices\/orgSlice/g, "@/common/state/slices/orgSlice"],
  [/@\/store\/slices\/chatSlice/g, "@/chat/state/chatSlice"],
  [/@\/lib\/supabase\//g, "@/common/services/supabase/"],
  [/@\/lib\/api/g, "@/common/services/api/client"],
  [/@\/lib\/auth-errors/g, "@/auth/services/errors"],
  [/@\/lib\/auth-validation/g, "@/auth/services/validation"],
  [/@\/lib\/auth-headers/g, "@/auth/services/headers"],
  [/@\/lib\/form-resolvers/g, "@/auth/services/form-resolvers"],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (exts.some((e) => name.endsWith(e))) files.push(p);
  }
  return files;
}

let changed = 0;
for (const d of dirs) {
  const base = path.join(root, d);
  for (const file of walk(base)) {
    let content = fs.readFileSync(file, "utf8");
    const orig = content;
    for (const [re, rep] of replacements) content = content.replace(re, rep);
    if (content !== orig) {
      fs.writeFileSync(file, content);
      changed++;
    }
  }
}

// proxy.ts at src root
const proxy = path.join(root, "proxy.ts");
if (fs.existsSync(proxy)) {
  let content = fs.readFileSync(proxy, "utf8");
  const orig = content;
  for (const [re, rep] of replacements) content = content.replace(re, rep);
  if (content !== orig) {
    fs.writeFileSync(proxy, content);
    changed++;
  }
}

console.log(`Updated ${changed} files`);
