// 跑断言式评测 + pass^k。运行：npx tsx src/main.ts
import { evalGolden, goldens, passHatK } from './eval';

// ---- 1. 断言式评测（promptfoo 风格）----
console.log('断言式评测（必答点 / 禁答点）');
console.log('='.repeat(60));
let passed = 0;
for (const g of goldens) {
  const r = evalGolden(g);
  if (r.pass) passed++;
  console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.question}`);
  console.log(`        agent 答：${r.answer}`);
  if (!r.pass) console.log(`        原因：${r.fails.join('；')}`);
}
console.log(`\n通过率：${passed}/${goldens.length}`);
console.log('注：那条 FAIL 是 agent 忠实地照着「过期知识（3000）」作答——faithfulness 高，但答案错。');
// 有断言不通过就非零退出——这样能直接接进 CI，评测红了流水线就红。
if (passed < goldens.length) process.exitCode = 1;

// ---- 2. pass^k：任务级可靠性 ----
console.log('\n\npass^k（同一任务重复 k 次要全过才算）');
console.log('='.repeat(60));
const tasks: { name: string; trials: boolean[] }[] = [
  { name: '退款任务（5 次对 4 次）', trials: [true, true, true, false, true] },
  { name: '库存任务（5 次全对）', trials: [true, true, true, true, true] },
];
for (const t of tasks) {
  const line = [1, 2, 3].map((k) => `pass^${k}=${passHatK(t.trials, k).toFixed(2)}`).join('  ');
  console.log(`${t.name}：${line}`);
}
console.log('\n退款任务 pass^1=0.80 看着还行，但 pass^3 只有 0.40——「平均分漂亮」和「稳定可靠」是两回事。');
console.log('覆盖度（第5章）+ 有效性（本章）一起进 CI，加第22章漂移检测，构成健康度看板。');
