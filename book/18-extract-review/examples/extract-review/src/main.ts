// 跑一条「抽取 → 检测 → 人审队列」的流水线。
// 运行：npx tsx src/main.ts

import { detect, existingKnowledge, extract } from './detect';

// 两段原始文本：一段事故复盘、一段 PR 讨论。
const sources: { name: string; text: string }[] = [
  {
    name: '事故复盘',
    text: '本次事故：一笔大额退款没走人工审核被薅。结论：退款金额超过 3000 元需人工审核。另外支付回调要加幂等。',
  },
  {
    name: 'PR 讨论',
    text: '提醒一下，退款金额超过 5000 元需要人工审核，别漏了。还有大促库存记得提前扩容。',
  },
];

console.log('已入库知识：');
existingKnowledge.forEach((k) => console.log(`  - ${k}`));

// ① 抽取候选
const candidates: string[] = [];
console.log('\n① 从原始文本抽取候选：');
for (const s of sources) {
  const cands = extract(s.text);
  cands.forEach((c) => {
    candidates.push(c);
    console.log(`  [${s.name}] ${c}`);
  });
}

// ②③④ 检测 + 进人审队列
console.log('\n②③ 检测 + 进人审队列（带标记，人决定）：');
console.log('='.repeat(64));
const queue = candidates.map(detect);
for (const r of queue) {
  console.log(`[${r.tag}] ${r.candidate}`);
  console.log(`    ${r.reason}`);
}

console.log('\n' + '='.repeat(64));
const byTag = queue.reduce<Record<string, number>>((a, r) => ((a[r.tag] = (a[r.tag] ?? 0) + 1), a), {});
console.log('人审队列汇总：' + Object.entries(byTag).map(([t, n]) => `${t} ${n}`).join('、'));
console.log('自动把该发现的都发现了（重复/冲突/新），最终入库与否由人拍板——降摩擦，但人守质量门。');
