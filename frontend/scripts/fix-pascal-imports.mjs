import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

const replacements = [
  ["@/dashboard/organisms/command-center", "@/dashboard/organisms/CommandCenter"],
  ["@/dashboard/organisms/attention-panel", "@/dashboard/organisms/AttentionPanel"],
  ["@/dashboard/organisms/ai-status-panel", "@/dashboard/organisms/AIStatusPanel"],
  ["@/dashboard/organisms/quick-actions", "@/dashboard/organisms/QuickActions"],
  ["@/auth/organisms/auth-shell", "@/auth/organisms/AuthShell"],
  ["@/auth/organisms/auth-marketing-panel", "@/auth/organisms/AuthMarketingPanel"],
  ["@/common/molecules/error-state", "@/common/molecules/ErrorState"],
  ["@/common/molecules/empty-state", "@/common/molecules/EmptyState"],
  ["@/common/molecules/loading-block", "@/common/molecules/LoadingBlock"],
  ["@/common/molecules/ai-processing-banner", "@/common/molecules/AIProcessingBanner"],
  ["@/common/organisms/layout/app-shell", "@/common/organisms/layout/AppShell"],
  ["@/common/organisms/layout/app-header", "@/common/organisms/layout/AppHeader"],
  ["@/common/organisms/layout/app-sidebar", "@/common/organisms/layout/AppSidebar"],
  ["@/common/atoms/logo-mark", "@/common/atoms/LogoMark"],
  ["@/common/atoms/logo", "@/common/atoms/Logo"],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p, files);
    else if (/\.(ts|tsx|md)$/.test(name)) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of walk(root)) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  for (const [from, to] of replacements) c = c.split(from).join(to);
  if (c !== orig) {
    fs.writeFileSync(file, c);
    n++;
  }
}
console.log(`Updated ${n} files`);
