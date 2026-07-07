// 审计藏在代码里的手写知识欠账：扫描代码，找出「业务知识已泄露到代码、但未结构化入库」的信号，
// 聚成一份待沉淀清单。把「知识不太够」的模糊焦虑，变成可逐条消化的欠账。
// 运行：npx tsx src/audit.ts

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'aishop');

function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...listTs(p));
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}

type Kind = 'BIZ-RULE 注释' | '业务 TODO/FIXME' | '未解释的魔法数字';

interface Debt {
  kind: Kind;
  file: string;
  line: number;
  snippet: string;
  owner: string; // 这些欠账天然「没主人」——这道摩擦直接体现在报告里
}

const debts: Debt[] = [];

for (const file of listTs(ROOT).sort()) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (/BIZ-RULE:/.test(line)) {
      debts.push({ kind: 'BIZ-RULE 注释', file: rel, line: i + 1, snippet: line, owner: 'unknown' });
    } else if (/\b(TODO|FIXME)\b/.test(line)) {
      debts.push({ kind: '业务 TODO/FIXME', file: rel, line: i + 1, snippet: line, owner: 'unknown' });
    }
    // 魔法数字：const X = <数字>，且数字不是 0/1（阈值/倍数这类业务参数）
    const m = line.match(/const\s+\w+\s*=\s*(\d+)\b/);
    if (m && Number(m[1]) > 1) {
      debts.push({ kind: '未解释的魔法数字', file: rel, line: i + 1, snippet: line, owner: 'unknown' });
    }
  });
}

console.log('aishop 手写知识欠账清单（业务知识已泄露到代码、但未结构化入库）');
console.log('='.repeat(64));
for (const d of debts) {
  console.log(`[${d.kind}] ${d.file}:${d.line}　owner: (${d.owner})`);
  console.log(`    ${d.snippet}`);
}

console.log('\n' + '='.repeat(64));
const byKind = debts.reduce<Record<string, number>>((acc, d) => {
  acc[d.kind] = (acc[d.kind] ?? 0) + 1;
  return acc;
}, {});
console.log(`共 ${debts.length} 条业务知识只以代码信号存在，未结构化、无 owner：`);
for (const [k, n] of Object.entries(byKind)) console.log(`  - ${k}：${n} 条`);
console.log('\n这份清单就是下一章 promote 要上收的原料——先制造出可寻址的结构化知识文件。');
