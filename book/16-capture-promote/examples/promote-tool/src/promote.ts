// promote：把就地沉淀的随手记，升级成带元数据的规范 L1 知识包条目。
// 「脏」的随手记零门槛捕获，「净」的规整集中在这一步。

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REF_DATE = '2026-07-06'; // 固定日期，保证可复现

// 读就地沉淀的随手记（`- ` 开头的行）。
export function readScratch(): string[] {
  const text = readFileSync(join(ROOT, '.kb', 'local', 'scratch.md'), 'utf8');
  return text
    .split('\n')
    .map((l) => l.match(/^-\s+(.+)$/)?.[1])
    .filter((x): x is string => !!x);
}

export interface PromoteSpec {
  note: string; // 原始随手记
  pkg: string; // 目标 L1 包
  slug: string; // 文件名
  title: string; // 规范标题
  owner: string; // 定 owner
}

// 把一条随手记升级成带 frontmatter 的 L1 条目，写入 out/kb/L1/<pkg>/<slug>.md。
export function promote(spec: PromoteSpec): string {
  // 从简：这里直接写入、同 slug 会覆盖。真实场景还需判断目标文件是否已存在，
  // 避免维护者重复 promote 时误覆盖已入库并被人工改过的条目。
  const dir = join(ROOT, 'out', 'kb', 'L1', spec.pkg);
  mkdirSync(dir, { recursive: true });
  const content =
    `---\n` +
    `title: ${spec.title}\n` +
    `type: reference\n` +
    `owner: ${spec.owner}\n` +
    `last_reviewed: ${REF_DATE}\n` +
    `status: active\n` +
    `---\n\n` +
    `- ${spec.note}\n`;
  const path = join(dir, `${spec.slug}.md`);
  writeFileSync(path, content, 'utf8');
  return path;
}
