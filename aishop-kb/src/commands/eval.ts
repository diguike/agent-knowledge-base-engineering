// aishop-kb eval —— 有效性度量（第 21 章）。
// 断言式评测（promptfoo 风格，必答点/禁答点）+ pass^k（任务级可靠性）。
// 生产直接用 promptfoo；这里用最小实现讲清机制，并直接对真实 kb 评测。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allChunks, REPO_ROOT } from '../lib/kb';
import { grams } from '../lib/embed';

interface Golden {
  question: string;
  mustInclude: string[];
  mustNotInclude: string[];
}

// mock agent：从真实 kb 按 2-gram 重合检索最相关的一条，直接作为答案（faithful 于召回）。
// 若 kb 里混进过期知识，agent 会忠实地照错知识作答——断言就会红，这正是 eval 的价值（faithfulness ≠ 答案对）。
function mockAgentAnswer(question: string, kb: string[]): string {
  const q = grams(question);
  let best = kb[0] ?? '';
  let bestScore = -1;
  for (const k of kb) {
    const score = grams(k).filter((g) => q.includes(g)).length;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

interface EvalResult {
  question: string;
  answer: string;
  pass: boolean;
  fails: string[];
}

function evalGolden(g: Golden, kb: string[]): EvalResult {
  const answer = mockAgentAnswer(g.question, kb);
  const fails: string[] = [];
  for (const m of g.mustInclude) if (!answer.includes(m)) fails.push(`缺必答点「${m}」`);
  for (const n of g.mustNotInclude) if (answer.includes(n)) fails.push(`命中禁答点「${n}」`);
  return { question: g.question, answer, pass: fails.length === 0, fails };
}

// pass^k：同一任务重复 k 次要全过。pass_hat_k = C(success,k)/C(trials,k)。
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
function passHatK(trials: boolean[], k: number): number {
  const success = trials.filter(Boolean).length;
  const denom = comb(trials.length, k);
  return denom === 0 ? 0 : comb(success, k) / denom;
}

export function run(): number {
  const kb = allChunks().map((c) => c.text);
  const golden = JSON.parse(readFileSync(join(REPO_ROOT, 'eval', 'golden.json'), 'utf8'));

  console.log('断言式评测（必答点 / 禁答点）（第 21 章）');
  console.log('='.repeat(60));
  let passed = 0;
  for (const g of golden.goldens as Golden[]) {
    const r = evalGolden(g, kb);
    if (r.pass) passed++;
    console.log(`[${r.pass ? 'PASS' : 'FAIL'}] ${r.question}`);
    console.log(`        agent 答：${r.answer}`);
    if (!r.pass) console.log(`        原因：${r.fails.join('；')}`);
  }
  console.log(`\n通过率：${passed}/${golden.goldens.length}`);

  console.log('\n\npass^k（同一任务重复 k 次要全过才算）');
  console.log('='.repeat(60));
  for (const t of golden.tasks as { name: string; trials: boolean[] }[]) {
    const line = [1, 2, 3].map((k) => `pass^${k}=${passHatK(t.trials, k).toFixed(2)}`).join('  ');
    console.log(`${t.name}：${line}`);
  }
  console.log('\n退款任务 pass^1=0.80 看着还行，但 pass^3 只有 0.40——「平均分漂亮」和「稳定可靠」是两回事。');

  const ok = passed === golden.goldens.length;
  console.log(`\nCI 门禁：断言通过率 ${passed}/${golden.goldens.length} —— ${ok ? '通过' : '判红'}`);
  return ok ? 0 : 1;
}
