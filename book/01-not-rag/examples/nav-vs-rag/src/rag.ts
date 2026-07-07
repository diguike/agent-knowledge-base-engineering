// 向量 RAG 路径：把整个仓库切成固定行数的 chunk，
// 每块算 embedding，查询时按余弦相似度概率召回 top-k。
// 注意：chunk 是「按行数」切的，会把 enum、流转表这些结构切断——
// 这正是本章要展示的问题。

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildVocab, cosine, tokenize, vectorize } from './embed';

// 固定行数切块，这里刻意用最朴素的形态做演示。
// 生产 RAG 会用重叠窗口（overlap）或 AST 感知切块来缓解结构切断，
// 但正文第一条论据说明了：即便如此，向量路径的索引维护与漂移问题依然存在。
const CHUNK_LINES = 6;

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

export interface Chunk {
  file: string;
  startLine: number;
  endLine: number;
  text: string;
}

// 把仓库切成 chunk。
export function chunkRepo(repoRoot: string): Chunk[] {
  const chunks: Chunk[] = [];
  for (const file of listFiles(repoRoot).sort()) {
    const lines = readFileSync(file, 'utf8').split('\n');
    for (let i = 0; i < lines.length; i += CHUNK_LINES) {
      const slice = lines.slice(i, i + CHUNK_LINES);
      if (slice.join('').trim() === '') continue;
      chunks.push({
        file: relative(repoRoot, file),
        startLine: i + 1,
        endLine: Math.min(i + CHUNK_LINES, lines.length),
        text: slice.join('\n'),
      });
    }
  }
  return chunks;
}

export interface RagHit {
  chunk: Chunk;
  score: number;
}

// 概率召回：对 query 算相似度，返回 top-k chunk。
export function ragRetrieve(repoRoot: string, query: string, k = 3): RagHit[] {
  const chunks = chunkRepo(repoRoot);
  const vocab = buildVocab([query, ...chunks.map((c) => c.text)]);
  const qVec = vectorize(tokenize(query), vocab);
  return chunks
    .map((chunk) => ({ chunk, score: cosine(qVec, vectorize(tokenize(chunk.text), vocab)) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
