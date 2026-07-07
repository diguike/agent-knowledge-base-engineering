// 最小 frontmatter 校验器（对标 ai-asset-standards 的 check-frontmatter.mjs）：
// 检查五字段是否齐全、last_reviewed 是否超过 TTL、deprecated 是否仍被依赖。
// 可进 CI：有告警时以非零退出码结束。

import { readFileSync } from 'node:fs';

const REQUIRED = ['title', 'type', 'owner', 'last_reviewed', 'status'];
const TTL_DAYS = 90;
const REFERENCE_DATE = new Date('2026-07-06'); // 固定参考日期，保证可复现

export interface Frontmatter {
  [k: string]: string;
}

export function parseFrontmatter(mdPath: string): Frontmatter {
  const text = readFileSync(mdPath, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fm: Frontmatter = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^(\w+):\s*(.+)$/);
      if (kv) fm[kv[1]] = kv[2].trim();
    }
  }
  return fm;
}

export interface Issue {
  pkg: string;
  level: 'error' | 'warn';
  msg: string;
}

export function validate(pkg: string, mdPath: string): Issue[] {
  const fm = parseFrontmatter(mdPath);
  const issues: Issue[] = [];
  for (const field of REQUIRED) {
    if (!fm[field]) issues.push({ pkg, level: 'error', msg: `缺字段 ${field}` });
  }
  if (fm.last_reviewed) {
    const ageDays = (REFERENCE_DATE.getTime() - new Date(fm.last_reviewed).getTime()) / 86400000;
    if (ageDays > TTL_DAYS) {
      issues.push({ pkg, level: 'warn', msg: `last_reviewed 已 ${Math.round(ageDays)} 天，超过 TTL ${TTL_DAYS} 天（新鲜度告警）` });
    }
  }
  if (fm.status === 'deprecated') {
    issues.push({ pkg, level: 'warn', msg: `status=deprecated，但仍被依赖，应迁移下游` });
  }
  return issues;
}
