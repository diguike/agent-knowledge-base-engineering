// 生成四种 agent 格式，再反向核对四份承载的规则集完全一致（证明单一源消除漂移）。
// 运行：npx tsx src/main.ts

import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateAll } from './generate';

const OUT = join(import.meta.dirname, '..', 'out');

const { rules, files } = generateAll();
console.log(`从单一源 .kb/rules.yaml 生成了 ${files.length} 种格式：`);
files.forEach((f) => console.log(`  out/${f}`));

// 反向解析每个文件里的 `- <text>` 条目，比对规则集。
function extractRules(file: string): Set<string> {
  const text = readFileSync(join(OUT, file), 'utf8');
  const set = new Set<string>();
  for (const line of text.split('\n')) {
    const m = line.match(/^-\s+(.+)$/);
    if (m) set.add(m[1].trim());
  }
  return set;
}

const expected = new Set(rules.map((r) => r.text));
console.log('\n一致性检查（反向解析四份文件，比对规则集）：');
let allConsistent = true;
for (const f of files) {
  const got = extractRules(f);
  const same = got.size === expected.size && [...expected].every((r) => got.has(r));
  console.log(`  ${same ? '✓' : '✗'} ${f}　承载 ${got.size} 条规则`);
  if (!same) allConsistent = false;
}

console.log('\n' + '='.repeat(56));
console.log(
  allConsistent
    ? '四种格式承载的规则集完全一致——单一源消除了多份手写的漂移。'
    : '发现不一致！',
);

// 演示「不覆盖手写内容」：往 CLAUDE.md 生成区之外塞一段手写内容，再重新生成，验证它没被冲掉。
const HANDWRITTEN = '手写补充：本项目是 aishop 电商后端，金额单位统一用分。';
appendFileSync(join(OUT, 'CLAUDE.md'), `\n${HANDWRITTEN}\n`, 'utf8');
generateAll(); // 再生成一次
const claudeMd = readFileSync(join(OUT, 'CLAUDE.md'), 'utf8');
const survived = claudeMd.includes(HANDWRITTEN);
console.log('\n手写内容保留检查（重新生成后）：');
console.log(`  ${survived ? '✓' : '✗'} CLAUDE.md 里的手写补充${survived ? '仍然保留' : '被冲掉了'}——生成器只替换标记之间的生成区。`);

if (!allConsistent || !survived) process.exitCode = 1;
