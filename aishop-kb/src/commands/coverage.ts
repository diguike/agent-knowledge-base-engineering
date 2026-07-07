// aishop-kb coverage —— 语义覆盖度扫描（第 5 章）。
// 把 kb 的知识块与 golden 测试问题嵌进同一空间，对知识聚类，逐簇算覆盖率，揪出「有知识没题考」的盲区。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allChunks, REPO_ROOT } from '../lib/kb';
import { buildVocab, cosine, vectorize } from '../lib/embed';
import { kmeans } from '../lib/kmeans';

const K = 5; // 语义区域数
const COVER_THRESHOLD = 0.25; // 相似度超过此值算「这簇被某个问题考到了」
const GATE = 0.5; // CI 门禁：覆盖率低于此值判红

// 抽主题词：2 字 n-gram 按跨知识块的文档频次排名。演示级近似，生产用真分词/关键词抽取。
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

export function run(): number {
  const knowledge = allChunks().map((c) => c.text);
  const questions: string[] = JSON.parse(
    readFileSync(join(REPO_ROOT, 'coverage', 'questions.json'), 'utf8'),
  ).questions;

  // 同空间嵌入：知识块 + 测试问题共用一份词表
  const vocab = buildVocab([...knowledge, ...questions]);
  const kVecs = knowledge.map((c) => vectorize(c, vocab));
  const qVecs = questions.map((q) => vectorize(q, vocab));
  const { assignments } = kmeans(kVecs, K);

  console.log('语义覆盖度报告（第 5 章）');
  console.log('='.repeat(60));
  let coveredClusters = 0;
  const blindClusters: number[] = [];
  const clusterIds = [...new Set(assignments)];
  for (const ci of clusterIds) {
    const memberIdx = knowledge.map((_, i) => i).filter((i) => assignments[i] === ci);
    const members = memberIdx.map((i) => knowledge[i]);
    let maxSim = 0;
    for (const i of memberIdx) for (const qv of qVecs) maxSim = Math.max(maxSim, cosine(kVecs[i], qv));
    const covered = maxSim >= COVER_THRESHOLD;
    if (covered) coveredClusters++;
    else blindClusters.push(ci);
    console.log(
      `\n簇 ${ci}　主题词：${topTerms(members).join('、')}　最高命中相似度 ${maxSim.toFixed(2)}　${covered ? '✓ 已覆盖' : '✗ 盲区'}`,
    );
    members.forEach((m) => console.log(`    - ${m}`));
  }

  const nonEmpty = clusterIds.length;
  const ratio = coveredClusters / nonEmpty;
  console.log('\n' + '='.repeat(60));
  console.log(`覆盖：${coveredClusters}/${nonEmpty} 个语义区域被测试问题考到（${(ratio * 100).toFixed(0)}%）。`);
  if (blindClusters.length) {
    console.log('\n盲区簇的候选问题（生产用大模型生成，这里用模板；人审后补进 golden）：');
    for (const ci of blindClusters) {
      const terms = topTerms(knowledge.filter((_, i) => assignments[i] === ci));
      console.log(`  簇 ${ci}（${terms.join('、')}）：关于「${terms[0] ?? ''}」，agent 应该知道哪些约束？`);
    }
  }
  const ok = ratio >= GATE;
  console.log(`\nCI 门禁：覆盖率 ${(ratio * 100).toFixed(0)}% ${ok ? '≥' : '<'} ${GATE * 100}% —— ${ok ? '通过' : '判红'}`);
  return ok ? 0 : 1;
}
