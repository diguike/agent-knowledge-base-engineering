// aishop-kb extract —— 从原始文本抽取候选知识 + 近重复/语义冲突检测（第 18 章）。
// 抽取重召回（生产用 LLM），检测挡掉重复和矛盾，最终由人拍板。这里演示前三步的机制。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { allChunks, REPO_ROOT } from '../lib/kb';
import { gramCosine } from '../lib/embed';

const DUP_THRESHOLD = 0.5; // 相似度超过此值算「和已有知识说的是同一件事」
const BIZ = ['退款', '审核', '风控', '库存', '扩容', '幂等', '回调', '下单', '对账']; // 业务关键词

const numbers = (s: string): string[] => s.match(/\d+/g) ?? [];

type Tag = '疑似冲突' | '疑似重复' | '新知识，可入库';
interface Reviewed {
  candidate: string;
  tag: Tag;
  reason: string;
}

// 抽取：从原始文本挖出含业务关键词的候选句。
function extract(rawText: string): string[] {
  return rawText
    .split(/[。；\n]/)
    .map((s) => s.trim())
    .filter((s) => s && BIZ.some((k) => s.includes(k)));
}

// 检测：近重复 + 语义冲突（相似但关键数字不同 → 冲突）。existing 从真实 kb 加载。
function detect(candidate: string, existing: string[]): Reviewed {
  let best = '';
  let bestSim = 0;
  for (const k of existing) {
    const sim = gramCosine(candidate, k);
    if (sim > bestSim) {
      bestSim = sim;
      best = k;
    }
  }
  if (bestSim >= DUP_THRESHOLD) {
    const cn = numbers(candidate);
    const en = numbers(best);
    if (cn.length && en.length && cn.join() !== en.join()) {
      return { candidate, tag: '疑似冲突', reason: `与「${best}」高度相似(${bestSim.toFixed(2)})但关键数字不同(${cn} vs ${en})` };
    }
    return { candidate, tag: '疑似重复', reason: `与「${best}」高度相似(${bestSim.toFixed(2)})` };
  }
  return { candidate, tag: '新知识，可入库', reason: `与已有知识都不相似(最高 ${bestSim.toFixed(2)})` };
}

export function run(): number {
  const existing = allChunks().map((c) => c.text); // 已入库知识（真实 kb）
  const sources: { name: string; text: string }[] = JSON.parse(
    readFileSync(join(REPO_ROOT, 'extract', 'sources.json'), 'utf8'),
  ).sources;

  console.log('已入库知识（来自真实 kb，共 ' + existing.length + ' 条）：');
  existing.forEach((k) => console.log(`  - ${k}`));

  const candidates: string[] = [];
  console.log('\n① 从原始文本抽取候选：');
  for (const s of sources) {
    for (const c of extract(s.text)) {
      candidates.push(c);
      console.log(`  [${s.name}] ${c}`);
    }
  }

  console.log('\n②③ 检测 + 进人审队列（带标记，人决定）：');
  console.log('='.repeat(64));
  const queue = candidates.map((c) => detect(c, existing));
  for (const r of queue) {
    console.log(`[${r.tag}] ${r.candidate}`);
    console.log(`    ${r.reason}`);
  }

  console.log('\n' + '='.repeat(64));
  const byTag = queue.reduce<Record<string, number>>((a, r) => ((a[r.tag] = (a[r.tag] ?? 0) + 1), a), {});
  console.log('人审队列汇总：' + Object.entries(byTag).map(([t, n]) => `${t} ${n}`).join('、'));
  console.log('自动把该发现的都发现了（重复/冲突/新），入库与否由人拍板——降摩擦，人守质量门。');
  return 0; // extract 是工具命令，产出人审队列，不作 CI 硬门禁
}
