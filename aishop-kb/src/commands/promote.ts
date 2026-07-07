// aishop-kb promote —— 就地随手记 → 规范 L1 条目（第 16 章）。
// 「脏」的随手记零门槛捕获在 .kb/local/scratch.md，「净」的规整集中在这一步：补 frontmatter、定 owner、写进 L1 包。

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT, REF_DATE } from '../lib/kb';

// 读就地沉淀的随手记（`- ` 开头的行）。
function readScratch(): string[] {
  const text = readFileSync(join(REPO_ROOT, '.kb', 'local', 'scratch.md'), 'utf8');
  return text
    .split('\n')
    .map((l) => l.match(/^-\s+(.+)$/)?.[1])
    .filter((x): x is string => !!x);
}

interface PromoteSpec {
  note: string;
  pkg: string; // 目标 L1 包目录
  slug: string;
  title: string;
  owner: string;
}

// 把一条随手记升级成带 frontmatter 的 L1 条目，写入 kb/L1/<pkg>/<slug>.md。
function promote(spec: PromoteSpec): string {
  const dir = join(REPO_ROOT, 'kb', 'L1', spec.pkg);
  mkdirSync(dir, { recursive: true });
  const date = REF_DATE.toISOString().slice(0, 10);
  const content =
    `---\n` +
    `title: ${spec.title}\n` +
    `type: reference\n` +
    `owner: ${spec.owner}\n` +
    `last_reviewed: ${date}\n` +
    `status: active\n` +
    `---\n\n` +
    `- ${spec.note}\n`;
  const path = join(dir, `${spec.slug}.md`);
  writeFileSync(path, content, 'utf8');
  return path;
}

export function run(): number {
  const notes = readScratch();
  console.log('就地沉淀的随手记（脏、无格式）：');
  notes.forEach((n, i) => console.log(`  [${i}] ${n}`));

  // 定期 promote：维护者挑值得上收的几条并规整。这里硬编码 specs 只为把流程钉死、可复现。
  const specs: PromoteSpec[] = [
    { note: notes[0], pkg: 'kb-refund', slug: 'refund-review-threshold', title: '退款人工审核阈值', owner: '财务老王' },
    { note: notes[1], pkg: 'kb-inventory', slug: 'promo-capacity', title: '大促库存扩容倍数', owner: '库存组' },
    { note: notes[2], pkg: 'kb-orders', slug: 'legacy-channel', title: 'legacy_channel 字段不可删', owner: '订单组' },
    { note: notes[3], pkg: 'kb-risk', slug: 'no-auto-refund-blocklist', title: '风控命中不允许自动退款', owner: '风控组' },
  ];
  // notes[4]「今天中午吃啥」是噪音，不上收，留在本地。

  console.log('\n定期 promote（补 frontmatter/owner，写成规范 L1 条目）：');
  for (const spec of specs) {
    const path = promote(spec);
    console.log(`\n  ✓ [${spec.pkg}] ${spec.title} —— 已上收到 ${path.replace(REPO_ROOT + '/', '')}`);
  }

  console.log('\n' + '='.repeat(56));
  console.log(`上收 ${specs.length} 条，噪音「${notes[notes.length - 1]}」留在本地未上收。`);
  console.log('一条脏随手记 → 带 owner/last_reviewed/status 的可治理 L1 条目——先脏后净的完整流转。');
  console.log('（上收后可再跑 `aishop-kb check` 验证这些新条目过质量门禁。）');
  return 0;
}
