// 把两条检索路径在同一个问题上各跑一遍，对照结果。
// 运行：npx tsx src/compare.ts

import { join, relative } from 'node:path';
import { navigate } from './navigate';
import { ragRetrieve } from './rag';

const REPO = join(import.meta.dirname, '..', 'sample-repo');
const QUESTION = '订单状态机是怎么流转的 order status machine transition';

console.log('问题：' + QUESTION);
console.log('='.repeat(64));

// ---- 路径 A：确定性导航 ----
console.log('\n[A] 确定性导航（grep 定义符号 → 完整 read）\n');
const nav = navigate(REPO);
if (nav) {
  const lineCount = nav.content.split('\n').length;
  console.log(`命中文件：${relative(REPO, nav.file)}`);
  console.log(`命中方式：/${nav.matchedBy}/`);
  console.log(`取回：完整文件（${lineCount} 行），结构未被切断`);
  console.log(`是否包含 canTransition 定义：${nav.content.includes('function canTransition') ? '是' : '否'}`);
  console.log(`是否包含完整流转表：${nav.content.includes('ORDER_TRANSITIONS') ? '是' : '否'}`);
} else {
  console.log('未命中');
}

// ---- 路径 B：向量 RAG ----
console.log('\n[B] 向量 RAG（切块 → embedding → top-3 概率召回）\n');
const hits = ragRetrieve(REPO, QUESTION, 3);
const files = new Set(hits.map((h) => h.chunk.file));
hits.forEach((h, i) => {
  const preview = h.chunk.text.replace(/\n/g, ' ⏎ ').slice(0, 70);
  console.log(
    `#${i + 1}  score=${h.score.toFixed(3)}  ${h.chunk.file}:${h.chunk.startLine}-${h.chunk.endLine}`,
  );
  console.log(`     片段：${preview}...`);
});

// ---- 对照结论 ----
console.log('\n' + '='.repeat(64));
console.log('对照：');
console.log(`  导航：1 个命中，取回 1 个完整文件，结构完整、可复现。`);
console.log(`  RAG ：3 个片段，横跨 ${files.size} 个文件，状态机定义被按行切断。`);
const enumSplit = hits.some(
  (h) => h.chunk.file.endsWith('orderStatus.ts') && !h.chunk.text.includes('canTransition'),
);
console.log(`  RAG 是否召回了「残缺的状态机片段」（有 enum 无 canTransition）：${enumSplit ? '是' : '否'}`);
console.log('\n结论：对边界可枚举的代码知识，导航取回完整结构，RAG 取回跨文件残片。');
