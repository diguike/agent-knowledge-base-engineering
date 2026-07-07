// 对照：同一个问题「谁调用了 canTransition」，
// 代码图谱沿调用边确定定位 vs 向量召回按文本相似度概率猜。
// 运行：npx tsx src/compare.ts

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildVocab, cosine, tokenize, vectorize } from './embed';
import { collectDefs, findCallers } from './graph';

const REPO = join(import.meta.dirname, '..', 'sample-repo');
const TARGET = 'canTransition';
const QUESTION = `谁调用了 ${TARGET} who calls ${TARGET}`;

console.log(`问题：${QUESTION}`);
console.log('='.repeat(60));

// ---- 路径 A：代码图谱 ----
console.log('\n[A] 代码图谱（沿「被调用」边遍历）\n');
const defs = collectDefs(REPO);
console.log(`图节点（函数定义）：${defs.map((d) => `${d.name}@${d.file}`).join(', ')}`);
const callers = findCallers(REPO, TARGET);
if (callers.length === 0) {
  console.log('无调用者');
} else {
  callers.forEach((c) => console.log(`调用者：${c.callerFn}()  于 ${c.callerFile}`));
}
console.log(`结果：确定，共 ${callers.length} 个真实调用者。`);

// ---- 路径 B：向量召回 ----
console.log('\n[B] 向量召回（按文本相似度概率召回 top-3）\n');
function listTs(dir: string): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const full = join(dir, n);
    if (statSync(full).isDirectory()) out.push(...listTs(full));
    else if (full.endsWith('.ts')) out.push(full);
  }
  return out;
}
const docs = listTs(REPO).map((f) => ({ file: relative(REPO, f), text: readFileSync(f, 'utf8') }));
const vocab = buildVocab([QUESTION, ...docs.map((d) => d.text)]);
const qv = vectorize(tokenize(QUESTION), vocab);
const ranked = docs
  .map((d) => ({ file: d.file, score: cosine(qv, vectorize(tokenize(d.text), vocab)) }))
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);
ranked.forEach((r, i) => console.log(`#${i + 1}  score=${r.score.toFixed(3)}  ${r.file}`));
const legacyRanked = ranked.some((r) => r.file.includes('legacy'));

// ---- 对照 ----
console.log('\n' + '='.repeat(60));
console.log('对照：');
console.log(`  代码图谱：确定返回 ${callers.length} 个真实调用者（${callers.map((c) => c.callerFn).join(', ')}）。`);
console.log(`  向量召回：返回按文本相似度排序的文件，真假掺杂。`);
console.log(`  向量是否把「只在注释里提到 canTransition、并未调用」的 legacy.ts 也召回了：${legacyRanked ? '是' : '否'}`);
console.log('\n结论：代码图谱沿调用边给确定答案，向量召回靠文本相似度，会把「提到但没调用」的干扰项也捞进来。');
