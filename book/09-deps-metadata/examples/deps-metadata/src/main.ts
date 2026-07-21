// 解析 aishop 的 manifest，打印召回边界；再校验所有 L1 包的元数据新鲜度。
// 运行：npx tsx src/main.ts

import { join } from 'node:path';
import { parseManifest } from './manifest';
import { validate, type Issue } from './validate';

const ROOT = join(import.meta.dirname, '..');

// ---- 1. 解析 manifest，展示召回边界 ----
const m = parseManifest(join(ROOT, 'aishop', 'knowledge.yaml'));
console.log('aishop 的召回边界（由 knowledge.yaml 圈定）');
console.log('='.repeat(56));
console.log(`L0 继承：${m.extends}`);
console.log(`\n文件侧（静态 L1 依赖，带版本）：`);
m.dependencies.forEach((d) => console.log(`  ${d.name} ${d.range}`));
console.log(`\n服务侧（动态知识订阅的 namespace）：`);
m.knowledgeDomains.forEach((d) => console.log(`  ${d}`));
console.log(`\n本地增量：${m.local}`);
console.log('\n-> 声明什么，就召回什么；文件侧靠依赖的包，服务侧靠订阅的 namespace。');

// ---- 2. 校验 L1 包元数据 ----
console.log('\n\n元数据新鲜度校验（对标 check-frontmatter.mjs）');
console.log('='.repeat(56));
const allIssues: Issue[] = [];
for (const dep of m.dependencies) {
  const dir = dep.name.replace('@kb/', 'kb-'); // @kb/orders -> kb-orders
  const mdPath = join(ROOT, 'kb', 'L1', dir, 'knowledge.md');
  const issues = validate(dir, mdPath);
  if (issues.length === 0) {
    console.log(`[OK]   ${dir}`);
  } else {
    for (const i of issues) console.log(`[${i.level.toUpperCase()}] ${i.pkg}：${i.msg}`);
  }
  allIssues.push(...issues);
}

console.log('\n' + '='.repeat(56));
const errors = allIssues.filter((i) => i.level === 'error').length;
const warns = allIssues.filter((i) => i.level === 'warn').length;
console.log(`校验完成：${errors} 个错误、${warns} 个告警。`);
console.log('这几类问题（缺 owner、新鲜度超期、废弃仍被依赖）正是第 23 章治理要系统解决的，这里先让它们可被机器检出。');
// 进 CI：有 error 时非零退出
if (errors > 0) process.exitCode = 1;
