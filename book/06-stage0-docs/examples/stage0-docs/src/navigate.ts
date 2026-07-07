// 模拟 coding agent 在阶段0 知识库上的确定性导航：
// ① 读 llms.txt 建立「有哪些知识、在哪」的全局认识
// ② 按问题关键词定位到某篇 docs
// ③ 完整 read 该文件返回
// 运行：npx tsx src/navigate.ts "6000 元订单能不能自动退款"

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(import.meta.dirname, '..', 'aishop');

interface DocEntry {
  title: string;
  path: string;
  desc: string;
}

// ① 解析 llms.txt 里的知识文档清单
function parseIndex(): DocEntry[] {
  const text = readFileSync(join(REPO, 'llms.txt'), 'utf8');
  const entries: DocEntry[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^- \[(.+?)\]\((.+?)\):\s*(.+)$/);
    if (m && m[2].startsWith('docs/')) entries.push({ title: m[1], path: m[2], desc: m[3] });
  }
  return entries;
}

// 抽 2 字 CJK 词片（比单字更能区分「订单」和「退款」这类意图）。
function bigrams(s: string): string[] {
  const out: string[] = [];
  for (const run of s.match(/[一-龥]{2,}/g) ?? []) {
    for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

// ② 按问题的 2-gram 与「标题 + 描述」的重合度定位文档（确定性打分，非概率召回）。
// 找不到任何锚点时返回 null——确定性的系统该老实说「找不到」，而不是自信地给个错答案。
function locate(question: string, docs: DocEntry[]): DocEntry | null {
  const qGrams = bigrams(question);
  let best: DocEntry | null = null;
  let bestScore = 0;
  for (const d of docs) {
    const docGrams = bigrams(d.title + ' ' + d.desc);
    // 对每个问题 2-gram，累加它在文档里出现的次数
    const score = qGrams.reduce((s, g) => s + docGrams.filter((x) => x === g).length, 0);
    if (score > bestScore) {
      bestScore = score;
      best = d;
    }
  }
  return best;
}

const question = process.argv[2] ?? '6000 元订单能不能自动退款';
const docs = parseIndex();

console.log(`问题：${question}`);
console.log('='.repeat(56));
console.log(`\n① 读 llms.txt，知道有 ${docs.length} 篇知识：${docs.map((d) => d.title).join('、')}`);

const hit = locate(question, docs);
if (!hit) {
  console.log('\n② 未命中任何文档：问题和索引里的知识都对不上，建议人工检索或补一篇 docs。');
  console.log('\n（确定性系统找不到锚点时就该老实说找不到，而不是硬给一个大概率错的答案。）');
  process.exit(0);
}
console.log(`\n② 确定性定位到：${hit.title}（${hit.path}）`);

const content = readFileSync(join(REPO, hit.path), 'utf8');
console.log(`\n③ 完整读回 ${hit.path}：\n`);
console.log(content.trim());

console.log('\n' + '='.repeat(56));
console.log('全程确定性、可复现，零基础设施。');
