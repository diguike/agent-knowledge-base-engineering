// 在上下文预算下组装 agent 要用的知识：对比「全塞」和「常驻 L0 + 按需检索」两种策略。
// token 数这里用一个显式字段近似（真实按 tokenizer 算）；relevance 用与查询的关键词重合近似。

export interface Knowledge {
  text: string;
  layer: 'L0' | 'L1'; // L0=少而稳的约定（该常驻）；L1=领域知识（该按需检索）
  tokens: number; // 近似 token 占用
}

export const knowledgeBase: Knowledge[] = [
  { text: '本仓库金额单位是分', layer: 'L0', tokens: 8 },
  { text: '提交走 conventional commits', layer: 'L0', tokens: 10 },
  { text: '退款金额超过 5000 需人工审核', layer: 'L1', tokens: 12 },
  { text: '命中风控名单的订单不允许自动退款', layer: 'L1', tokens: 14 },
  { text: '大促库存扩容到平时 3 倍', layer: 'L1', tokens: 10 },
  { text: '对账凌晨跑，差异查支付回调', layer: 'L1', tokens: 12 },
  { text: '订单状态机 created 到 delivered', layer: 'L1', tokens: 14 },
];

function grams(s: string): string[] {
  const out: string[] = [];
  for (const run of s.match(/[一-龥]{2,}/g) ?? []) for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
  return out;
}

// 与查询的相关度：2-gram 重合数。
export function relevance(k: Knowledge, query: string): number {
  const q = grams(query);
  const t = grams(k.text);
  return q.filter((g) => t.includes(g)).length;
}

export interface Assembly {
  injected: Knowledge[];
  totalTokens: number;
  overBudget: boolean;
}

// 策略 A：全塞——把所有知识都常驻。
export function assembleStuffAll(): Assembly {
  const injected = knowledgeBase;
  const totalTokens = injected.reduce((s, k) => s + k.tokens, 0);
  return { injected, totalTokens, overBudget: totalTokens > BUDGET };
}

export const BUDGET = 50; // 留给知识的上下文预算（token）

// 策略 B：常驻 L0 + 在剩余预算内按相关度检索 L1。
export function assembleSmart(query: string): Assembly {
  const injected: Knowledge[] = knowledgeBase.filter((k) => k.layer === 'L0'); // L0 必须在
  let used = injected.reduce((s, k) => s + k.tokens, 0);
  const candidates = knowledgeBase
    .filter((k) => k.layer === 'L1' && relevance(k, query) > 0)
    .sort((a, b) => relevance(b, query) - relevance(a, query));
  for (const k of candidates) {
    if (used + k.tokens <= BUDGET) {
      injected.push(k);
      used += k.tokens;
    }
  }
  return { injected, totalTokens: used, overBudget: used > BUDGET };
}
