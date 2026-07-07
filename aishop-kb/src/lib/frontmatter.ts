// 五字段 frontmatter 解析（title/type/owner/last_reviewed/status）。零依赖，不引 YAML 库。

import { readFileSync } from 'node:fs';

export interface Parsed {
  fm: Record<string, string>;
  body: string;
}

export function parseFrontmatter(path: string): Parsed {
  const text = readFileSync(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm: Record<string, string> = {};
  if (!m) return { fm, body: text };
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2] };
}

export const REQUIRED_FIELDS = ['title', 'type', 'owner', 'last_reviewed', 'status'];
export const DIATAXIS = ['tutorial', 'how-to', 'reference', 'explanation'];
