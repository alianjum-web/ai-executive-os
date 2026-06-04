import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

const replacements = [
  // Order matters: longer paths first
  ["@/common/", "@/common/"],
  ["@/auth/", "@/auth/"],
  ["@/chat/", "@/chat/"],
  ["@/dashboard/", "@/dashboard/"],
  ["@/knowledge/", "@/knowledge/"],
  ["@/tickets/", "@/tickets/"],
  ["@/welcome/", "@/welcome/"],
  ["@/auth/services/", "@/auth/services/"],
  ["@/common/services/supabase/", "@/common/services/supabase/"],
  ["@/common/services/api/", "@/common/services/api/"],
  ["@/common/store/hooks", "@/common/store/hooks"],
  ["@/common/store/", "@/common/store/"],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, files);
    } else if (/\.(ts|tsx|md|mjs)$/.test(name)) files.push(p);
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

// scripts folder
const scriptsDir = path.join(process.cwd(), "scripts");
if (fs.existsSync(scriptsDir)) {
  for (const file of walk(scriptsDir)) {
    let c = fs.readFileSync(file, "utf8");
    const orig = c;
    for (const [from, to] of replacements) c = c.split(from).join(to);
    if (c !== orig) {
      fs.writeFileSync(file, c);
      n++;
    }
  }
}

console.log(`Updated ${n} files`);
