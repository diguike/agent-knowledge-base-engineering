// 从原始文本抽取候选知识，对每个候选做近重复检测 + 语义冲突检测，输出人审队列。
// 抽取重召回（生产用 LLM）；检测挡掉重复和矛盾；最终由人拍板——本文件只做前三步的机制演示。

const DUP_THRESHOLD = 0.5; // 相似度超过此值算「和已有知识说的是同一件事」

// ---- 已入库的知识 ----
export const existingKnowledge = [
  '退款金额超过 5000 元需人工审核',
  '命中风控名单的订单不允许自动退款',
];

// ---- 本地词袋 embedding（2-gram），离线可复现 ----
function grams(s: string): string[] {
  const out: string[] = [];
  for (const run of s.match(/[一-龥]{2,}|[a-z0-9]+/gi) ?? []) {
    if (/[一-龥]/.test(run)) for (let i = 0; i + 2 <= run.length; i++) out.push(run.slice(i, i + 2));
    else out.push(run.toLowerCase());
  }
  return out;
}
function cosine(a: string[], b: string[]): number {
  const all = [...new Set([...a, ...b])];
  const va = all.map((t) => a.filter((x) => x === t).length);
  const vb = all.map((t) => b.filter((x) => x === t).length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < all.length; i++) {
    dot += va[i] * vb[i];
    na += va[i] * va[i];
    nb += vb[i] * vb[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
}
const numbers = (s: string): string[] => s.match(/\d+/g) ?? [];

// ---- ① 抽取：从原始文本挖出含业务关键词的候选句 ----
const BIZ = ['退款', '审核', '风控', '库存', '扩容', '幂等', '回调'];
export function extract(rawText: string): string[] {
  return rawText
    .split(/[。；\n]/)
    .map((s) => s.trim())
    .filter((s) => s && BIZ.some((k) => s.includes(k)));
}

export type Tag = '疑似冲突' | '疑似重复' | '新知识，可入库';
export interface Reviewed {
  candidate: string;
  tag: Tag;
  reason: string;
}

// ---- ②③ 检测：近重复 + 语义冲突 ----
export function detect(candidate: string): Reviewed {
  let best = '';
  let bestSim = 0;
  for (const k of existingKnowledge) {
    const sim = cosine(grams(candidate), grams(k));
    if (sim > bestSim) {
      bestSim = sim;
      best = k;
    }
  }
  if (bestSim >= DUP_THRESHOLD) {
    const cn = numbers(candidate);
    const en = numbers(best);
    // 相似但关键数字不同 → 冲突；否则 → 近重复
    if (cn.length && en.length && cn.join() !== en.join()) {
      return { candidate, tag: '疑似冲突', reason: `与「${best}」高度相似(${bestSim.toFixed(2)})但关键数字不同(${cn} vs ${en})` };
    }
    return { candidate, tag: '疑似重复', reason: `与「${best}」高度相似(${bestSim.toFixed(2)})` };
  }
  return { candidate, tag: '新知识，可入库', reason: `与已有知识都不相似(最高 ${bestSim.toFixed(2)})` };
}
