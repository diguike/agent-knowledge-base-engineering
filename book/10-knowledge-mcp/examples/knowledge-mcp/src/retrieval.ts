// 检索层：把 aishop 的 L1 知识包索引成 chunk，做「namespace 过滤 → 混合检索 → rerank」。
// 零依赖、离线可跑。生产会把本地词袋 embedding 换成真模型、rerank 换成专门重排模型。

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KB_ROOT = join(import.meta.dirname, '..', 'kb');

export interface Chunk {
  namespace: string; // 知识包名，即 namespace
  text: string;
}

// 索引：每个知识包一个 namespace，按行（每条规则）切 chunk。
export function buildIndex(): Chunk[] {
  const chunks: Chunk[] = [];
  for (const ns of readdirSync(KB_ROOT)) {
    const md = readFileSync(join(KB_ROOT, ns, 'knowledge.md'), 'utf8');
    for (const line of md.split('\n')) {
      const t = line.replace(/^-\s*/, '').trim();
      if (t) chunks.push({ namespace: ns, text: t });
    }
  }
  return chunks;
}

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+|[一-龥]{2}/g) ?? [];
}

// 关键词得分：query 与 chunk 的 token 重合数。
function keywordScore(q: string[], c: string[]): number {
  return q.filter((t) => c.includes(t)).length;
}

// 向量得分：本地词袋余弦（简化的语义相似度）。
function vectorScore(q: string[], c: string[]): number {
  const all = [...new Set([...q, ...c])];
  const qv = all.map((t) => (q.includes(t) ? 1 : 0));
  const cv = all.map((t) => (c.includes(t) ? 1 : 0));
  let dot = 0;
  let nq = 0;
  let nc = 0;
  for (let i = 0; i < all.length; i++) {
    dot += qv[i] * cv[i];
    nq += qv[i];
    nc += cv[i];
  }
  return nq === 0 || nc === 0 ? 0 : dot / (Math.sqrt(nq) * Math.sqrt(nc));
}

export interface Hit {
  namespace: string;
  text: string;
  score: number;
}

// namespace 过滤 → 混合检索（关键词 + 向量）→ rerank（这里用关键词精确命中做加权重排）→ top-k。
export function retrieve(query: string, namespace?: string, k = 3): Hit[] {
  const index = buildIndex();
  const scoped = namespace ? index.filter((c) => c.namespace === namespace) : index;
  const q = tokens(query);
  const scored = scoped.map((c) => {
    const ct = tokens(c.text);
    const kw = keywordScore(q, ct);
    const vec = vectorScore(q, ct);
    // 混合：关键词 + 向量；rerank：关键词精确命中额外加权，把「字面对得上」的顶上来
    const score = 0.5 * vec + 0.5 * Math.min(1, kw / Math.max(1, q.length)) + 0.3 * kw;
    return { namespace: c.namespace, text: c.text, score };
  });
  return scored
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
