// 对一批待入库知识条目跑四层质量门禁，输出报告，有问题以非零退出码结束（可进 CI）。
// 运行：npx tsx src/main.ts

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkEntry } from './gate';

const KB = join(import.meta.dirname, '..', 'kb');

function listMd(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...listMd(p));
    else if (p.endsWith('.md')) out.push(p);
  }
  return out;
}

console.log('知识质量门禁（结构/元数据 · Diátaxis 单型 · prose lint · 死链）');
console.log('='.repeat(64));

let failed = 0;
for (const file of listMd(KB).sort()) {
  const rel = relative(KB, file);
  const issues = checkEntry(file);
  if (issues.length === 0) {
    console.log(`[PASS] ${rel}`);
  } else {
    failed++;
    console.log(`[FAIL] ${rel}`);
    for (const i of issues) console.log(`         └ [${i.gate}] ${i.msg}`);
  }
}

console.log('\n' + '='.repeat(64));
console.log(`${failed} 条被门禁拦下——机器筛掉这些客观问题，CODEOWNERS 只审剩下过关的内容对不对。`);
if (failed > 0) process.exitCode = 1;
