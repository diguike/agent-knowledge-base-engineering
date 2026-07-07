// 语义覆盖度工具：把知识块和测试问题嵌进同一空间，
// 对知识做 K-means 聚类，逐簇算覆盖率，对盲区簇生成候选问题。
// 运行：npx tsx src/coverage.ts

import { buildVocab, cosine, tokenize, vectorize } from './embed';
import { kmeans } from './kmeans';
import { knowledgeChunks, testQuestions } from './data';

const K = 5; // 语义区域数
const COVER_THRESHOLD = 0.25; // 相似度超过此值算「这簇被某个问题考到了」

// ① 同空间嵌入：知识块 + 测试问题共用一份词表
const vocab = buildVocab([...knowledgeChunks, ...testQuestions]);
const kVecs = knowledgeChunks.map((c) => vectorize(c, vocab));
const qVecs = testQuestions.map((q) => vectorize(q, vocab));

// ② 对知识块聚类
const { assignments } = kmeans(kVecs, K);

// 抽主题词：没有中文分词器，这里用 2 字 n-gram 按「跨知识块出现频次」排名，
// 跨多个块共现的词（如 库存 / 对账 / 退款）会自然冒头。这是演示级近似，
// 生产会用真正的分词/关键词抽取。
function topTerms(texts: string[], n = 3): string[] {
  const docFreq = new Map<string, number>();
  for (const t of texts) {
    const seen = new Set<string>();
    for (const run of t.match(/[一-龥]{2,}/g) ?? []) {
      for (let i = 0; i + 2 <= run.length; i++) seen.add(run.slice(i, i + 2));
    }
    for (const g of seen) docFreq.set(g, (docFreq.get(g) ?? 0) + 1);
  }
  return [...docFreq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map((e) => e[0]);
}

// ③ 逐簇算覆盖率
console.log('语义覆盖度报告');
console.log('='.repeat(60));
let coveredClusters = 0;
const blindClusters: number[] = [];
for (let ci = 0; ci < K; ci++) {
  const memberIdx = knowledgeChunks.map((_, i) => i).filter((i) => assignments[i] === ci);
  if (memberIdx.length === 0) continue;
  const members = memberIdx.map((i) => knowledgeChunks[i]);
  // 这簇里任一知识块与任一测试问题的最大相似度
  let maxSim = 0;
  for (const i of memberIdx) for (const qv of qVecs) maxSim = Math.max(maxSim, cosine(kVecs[i], qv));
  const covered = maxSim >= COVER_THRESHOLD;
  if (covered) coveredClusters++;
  else blindClusters.push(ci);

  console.log(`\n簇 ${ci}　主题词：${topTerms(members).join('、')}　最高命中相似度 ${maxSim.toFixed(2)}　${covered ? '✓ 已覆盖' : '✗ 盲区'}`);
  members.forEach((m) => console.log(`    - ${m}`));
}

// ④ 对盲区簇生成候选问题
console.log('\n' + '='.repeat(60));
const nonEmpty = new Set(assignments).size;
console.log(`覆盖：${coveredClusters}/${nonEmpty} 个语义区域被测试问题考到。`);
if (blindClusters.length) {
  console.log('\n盲区簇的候选问题（生产用大模型生成，这里用模板；人审后补进 golden）：');
  for (const ci of blindClusters) {
    const members = knowledgeChunks.filter((_, i) => assignments[i] === ci);
    const terms = topTerms(members);
    console.log(`  簇 ${ci}（${terms.join('、')}）：关于「${terms[0] ?? ''}」，agent 应该知道哪些约束？`);
  }
  console.log('\n结论：这些盲区簇里有知识、却一道题都没考到——正是自动聚类替你揪出、人工出题极易漏掉的地方。');
} else {
  console.log('没有盲区簇。');
}
