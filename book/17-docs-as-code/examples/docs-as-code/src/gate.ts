// 知识质量门禁：四层客观检查。机器先筛掉结构/类型/文风/死链问题，人（CODEOWNERS）只审筛不掉的。
// 对标 ai-asset-standards 的 docs-ci.yml。

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REQUIRED = ['title', 'type', 'owner', 'last_reviewed', 'status'];
const DIATAXIS = ['tutorial', 'how-to', 'reference', 'explanation'];
// AI 味道黑名单（Vale 风格的 prose 规则）
const AI_TASTE = ['让我们来探索', '值得注意的是', '不难发现', '显而易见', '众所周知'];

export interface Issue {
  gate: string;
  msg: string;
}

function parseFrontmatter(text: string): { fm: Record<string, string>; body: string } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const fm: Record<string, string> = {};
  if (!m) return { fm, body: text };
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { fm, body: m[2] };
}

export function checkEntry(path: string): Issue[] {
  const text = readFileSync(path, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  const issues: Issue[] = [];

  // ① 结构/元数据：五字段齐不齐
  for (const f of REQUIRED) if (!fm[f]) issues.push({ gate: '结构/元数据', msg: `缺字段 ${f}` });

  // ② Diátaxis 单型：type 合法
  if (fm.type && !DIATAXIS.includes(fm.type)) {
    issues.push({ gate: 'Diátaxis 单型', msg: `type「${fm.type}」不是合法类型（应为 ${DIATAXIS.join('/')}）` });
  }

  // ③ prose lint：AI 味道黑名单
  for (const bad of AI_TASTE) if (body.includes(bad)) issues.push({ gate: 'prose lint', msg: `命中 AI 套话「${bad}」` });

  // ④ 死链：正文里 [x](相对路径) 指向的本地文件是否存在
  for (const lm of body.matchAll(/\[[^\]]+\]\((\.[^)]+)\)/g)) {
    const target = join(dirname(path), lm[1]);
    if (!existsSync(target)) issues.push({ gate: '死链', msg: `链接失效：${lm[1]}` });
  }

  return issues;
}
