// 有效性评测：断言式评测（promptfoo 风格）+ pass^k（任务级可靠性）。
// 生产直接用 promptfoo（原生 TS/YAML/CI 友好）；这里用最小实现讲清机制。

// ---- agent 接的知识库（故意留一条过期知识，演示 faithfulness 高但答案错）----
export const agentKB = [
  '退款金额超过 3000 元需人工审核', // 过期！真实早改成 5000
  '命中风控名单的订单不允许自动退款',
  '下单必须先锁库存再创建订单',
];

// ---- golden 问答（带必答点/禁答点，来自第 4 章）----
export interface Golden {
  question: string;
  mustInclude: string[]; // 必答点
  mustNotInclude: string[]; // 禁答点
}
export const goldens: Golden[] = [
  { question: '退款多少金额要人工审核', mustInclude: ['5000'], mustNotInclude: ['3000'] },
  { question: '命中风控名单能自动退款吗', mustInclude: ['不允许', '风控'], mustNotInclude: [] },
  { question: '下单要注意什么', mustInclude: ['锁库存'], mustNotInclude: [] },
];

function grams(s: string): string[] {
  const out: string[] = [];
  for (const run of s.match(/[一-龥]{2,}|\d+/g) ?? []) {
    if (/^\d+$/.test(run)) out.push(run);
    else for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  }
  return out;
}

// mock agent：按关键词重合检索最相关的知识条目，直接作为答案（faithful 于召回）。
export function mockAgentAnswer(question: string): string {
  const q = grams(question);
  let best = agentKB[0];
  let bestScore = -1;
  for (const k of agentKB) {
    const score = grams(k).filter((g) => q.includes(g)).length;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

export interface EvalResult {
  question: string;
  answer: string;
  pass: boolean;
  fails: string[];
}

// 断言式判定：命中所有必答点、避开所有禁答点。
export function evalGolden(g: Golden): EvalResult {
  const answer = mockAgentAnswer(g.question);
  const fails: string[] = [];
  for (const m of g.mustInclude) if (!answer.includes(m)) fails.push(`缺必答点「${m}」`);
  for (const n of g.mustNotInclude) if (answer.includes(n)) fails.push(`命中禁答点「${n}」`);
  return { question: g.question, answer, pass: fails.length === 0, fails };
}

// ---- pass^k：同一任务重复 k 次要全过。pass_hat_k = C(success,k)/C(trials,k) ----
function comb(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}
export function passHatK(trials: boolean[], k: number): number {
  const success = trials.filter(Boolean).length;
  const denom = comb(trials.length, k);
  return denom === 0 ? 0 : comb(success, k) / denom;
}
