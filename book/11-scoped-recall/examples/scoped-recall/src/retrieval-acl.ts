// 在上一章检索层的基础上加一道 ACL 过滤：召回阶段就只在「当前角色有权访问」的片段里检索。
// 权限和 namespace 一样，是在召回那一刻生效的，不是事后过滤。

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KB_ROOT = join(import.meta.dirname, '..', 'kb');

export interface Chunk {
  namespace: string;
  text: string;
  roles: string[]; // 允许访问该片段的角色（ACL）
}

// 索引：解析每行的 (roles: ...) 标注。
export function buildIndex(): Chunk[] {
  const chunks: Chunk[] = [];
  for (const ns of readdirSync(KB_ROOT)) {
    const md = readFileSync(join(KB_ROOT, ns, 'knowledge.md'), 'utf8');
    for (const line of md.split('\n')) {
      const m = line.match(/^-\s*\(roles:\s*(.+?)\)\s*(.+)$/);
      if (m) chunks.push({ namespace: ns, roles: m[1].split(',').map((s) => s.trim()), text: m[2].trim() });
    }
  }
  return chunks;
}

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+|[一-龥]{2}/g) ?? [];
}

export interface Hit {
  namespace: string;
  text: string;
  score: number;
}

// 双重过滤：① namespace ② 角色权限，都在召回阶段生效；然后在剩下的范围里做关键词+向量混合检索。
export function retrieve(query: string, opts: { namespace?: string; role: string }, k = 3): Hit[] {
  const index = buildIndex();
  const scoped = index
    .filter((c) => (opts.namespace ? c.namespace === opts.namespace : true))
    .filter((c) => c.roles.includes(opts.role)); // 权限下推：无权的片段压根不进入检索
  const q = tokens(query);
  return scoped
    .map((c) => {
      const ct = tokens(c.text);
      const kw = q.filter((t) => ct.includes(t)).length;
      return { namespace: c.namespace, text: c.text, score: kw };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
