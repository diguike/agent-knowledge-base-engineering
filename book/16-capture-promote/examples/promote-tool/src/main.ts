// 选几条随手记 promote 成规范 L1 条目，展示「脏 → 净」的流转；噪音留在本地不上收。
// 运行：npx tsx src/main.ts

import { readFileSync } from 'node:fs';
import { promote, readScratch, type PromoteSpec } from './promote';

const notes = readScratch();
console.log('就地沉淀的随手记（脏、无格式）：');
notes.forEach((n, i) => console.log(`  [${i}] ${n}`));

// 定期 promote：指定要上收哪几条 + 规整信息（现实里由维护者定期做）。
// 注：这里硬编码 specs 只是为了在书里把流程钉死、方便复现；
// 真实场景是维护者打开 scratch.md 肉眼判断哪几条值得收，不是写代码选。
const specs: PromoteSpec[] = [
  { note: notes[0], pkg: 'kb-refund', slug: 'refund-review-threshold', title: '退款人工审核阈值', owner: '财务老王' },
  { note: notes[1], pkg: 'kb-inventory', slug: 'promo-capacity', title: '大促库存扩容倍数', owner: '库存组' },
  { note: notes[2], pkg: 'kb-orders', slug: 'legacy-channel', title: 'legacy_channel 字段不可删', owner: '订单组' },
  { note: notes[3], pkg: 'kb-risk', slug: 'no-auto-refund-blocklist', title: '风控命中不允许自动退款', owner: '风控组' },
];
// 注意：notes[4]「今天中午吃啥」是噪音，不上收，留在本地。

console.log('\n定期 promote（补 frontmatter/owner，写成规范 L1 条目）：');
for (const spec of specs) {
  const path = promote(spec);
  console.log(`\n  ✓ [${spec.pkg}] ${spec.title} —— 已上收`);
  console.log('  ' + '-'.repeat(52));
  readFileSync(path, 'utf8').trim().split('\n').forEach((l) => console.log('  ' + l));
}

console.log('\n' + '='.repeat(56));
console.log(`上收 ${specs.length} 条，噪音「${notes[4]}」留在本地未上收。`);
console.log('一条脏随手记 → 带 owner、last_reviewed、status 的可治理 L1 条目——先脏后净的一次完整流转。');
