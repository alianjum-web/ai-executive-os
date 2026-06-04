import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "src");

const replacements = [
  ["@/common/lib/", "@/common/lib/"],
  ["@/common/config/", "@/common/config/"],
  ["@/common/atoms/ui/", "@/common/atoms/ui/"],
  ["@/common/atoms/", "@/common/atoms/"],
  ["@/common/organisms/providers/", "@/common/organisms/providers/"],
  ["@/common/molecules/", "@/common/molecules/"],
  ["@/common/organisms/", "@/common/organisms/"],
  [
    "@/common/organisms/DashboardTemplate",
    "@/common/organisms/DashboardTemplate",
  ],
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(p, files);
    } else if (/\.(ts|tsx|md|mjs|css)$/.test(name)) files.push(p);
  }
  return files;
}

let n = 0;
for (const file of [...walk(root), ...walk(path.join(process.cwd(), "scripts"))]) {
  let c = fs.readFileSync(file, "utf8");
  const orig = c;
  for (const [from, to] of replacements) c = c.split(from).join(to);
  if (c !== orig) {
    fs.writeFileSync(file, c);
    n++;
  }
}
console.log(`Updated ${n} files`);
