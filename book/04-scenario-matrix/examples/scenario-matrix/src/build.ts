// 把 SME 访谈 + query 日志两个来源合并成一张「业务场景 × 任务场景」矩阵，
// 标出每个格子有没有 golden（盲区一目了然），并指出哪些场景是 SME 漏掉、靠 query 日志才发现的。
// 运行：npx tsx src/build.ts

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { goldens, rawQueries, smeScenarios, taskScenarios } from './data';

// 把一条原始问句归到业务场景。这是「聚类」这一步在做的事。
// 真实项目会换成 embedding + 相似度聚类（把语义相近的问句自动聚成簇）；
// 这里用关键词规则演示「归类」该长什么样。规则顺序决定优先级：
// 「命中风控名单还能退款吗」同时含风控与退款，风控规则在前，故归风控。
const rules: [string, RegExp][] = [
  ['风控', /风控|名单/],
  ['对账', /对账|差异/],
  ['下单', /下单/],
  ['支付', /支付|回调/],
  ['退款', /退款/],
  ['库存', /库存|扩容/],
];
function classify(q: string): string {
  for (const [scenario, re] of rules) if (re.test(q)) return scenario;
  return '未分类';
}

// 聚类：把原始 query 归类并按场景累加频次。
const clustered = new Map<string, number>();
for (const { q, freq } of rawQueries) {
  const scenario = classify(q);
  clustered.set(scenario, (clustered.get(scenario) ?? 0) + freq);
}

// 业务场景（行）= 两个来源的并集。
const businessScenarios = [...new Set([...smeScenarios, ...clustered.keys()])];

// SME 漏掉、只在 query 日志里出现的场景。
const smeMissed = [...clustered.keys()].filter((s) => !smeScenarios.includes(s));

// 某个格子是否有 golden。
const hasGolden = (scenario: string, task: string) =>
  goldens.some((g) => g.scenario === scenario && g.task === task);

// ---- 打印矩阵 ----
console.log('业务场景 × 任务场景 覆盖矩阵（✓=有 golden，✗=盲区）');
console.log('='.repeat(56));
const pad = (s: string, n: number) => s + '　'.repeat(Math.max(0, n - s.length));
console.log(pad('场景\\任务', 6) + taskScenarios.map((t) => pad(t, 5)).join(''));
let covered = 0;
const total = businessScenarios.length * taskScenarios.length;
for (const b of businessScenarios) {
  const cells = taskScenarios.map((t) => {
    const ok = hasGolden(b, t);
    if (ok) covered++;
    return pad(ok ? '　✓' : '　✗', 5);
  });
  const freqTag = clustered.has(b) ? `  (query 频次 ${clustered.get(b)})` : '';
  console.log(pad(b, 6) + cells.join('') + freqTag);
}

console.log('\n' + '='.repeat(56));
console.log(`覆盖：${covered}/${total} 个格子有 golden（${((covered / total) * 100).toFixed(0)}%）。`);
console.log(`SME 访谈漏掉、靠 query 日志才发现的场景：${smeMissed.join('、') || '无'}`);
console.log('  -> 这些整行大概率是盲区，正是「两个来源缺一不可」的直接证据。');

// ---- 写出结构化文件，供下一章覆盖度工具消费 ----
const out = {
  businessScenarios,
  taskScenarios,
  smeMissed,
  goldens,
};
const outPath = join(import.meta.dirname, '..', 'scenario-matrix.json');
writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(`\n已写出场景矩阵到 scenario-matrix.json（下一章覆盖度工具的输入）。`);
