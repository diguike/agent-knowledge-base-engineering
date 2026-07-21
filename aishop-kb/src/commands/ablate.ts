// aishop-kb ablate —— 消融实验：知识库边际贡献的度量与归因（第 22 章）。
// 臂 = 知识子集（挂载矩阵）：full / 逐包摘除 / bare，同一套 golden 逐臂打分，输出 uplift 与翻转归因。
// 本命令在内存里按 namespace 切子集（依赖声明即召回边界，也因此天然是消融的控制开关）；
// 对业务仓库做文件级臂物化（git worktree + 挂载裁剪 + 泄漏防护），见 examples/ablation-harness/。

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadPackages, REPO_ROOT, type KbPackage } from '../lib/kb';
import { grams } from '../lib/embed';

interface Golden {
  question: string;
  mustInclude: string[];
  mustNotInclude: string[];
}

interface Arm {
  name: string;
  exclude: string[]; // 被摘掉的包目录名
}

// 与 eval 同一个 mock agent：按 2-gram 重合从（子集）kb 检索最相关一条作为答案。
function mockAgentAnswer(question: string, kb: string[]): string {
  const q = grams(question);
  let best = '';
  let bestScore = 0;
  for (const k of kb) {
    const score = grams(k).filter((g) => q.includes(g)).length;
    if (score > bestScore) {
      bestScore = score;
      best = k;
    }
  }
  return best;
}

function passes(g: Golden, kb: string[]): boolean {
  const answer = mockAgentAnswer(g.question, kb);
  for (const m of g.mustInclude) if (!answer.includes(m)) return false;
  for (const n of g.mustNotInclude) if (answer.includes(n)) return false;
  return true;
}

export function run(): number {
  const pkgs = loadPackages();
  const golden = JSON.parse(readFileSync(join(REPO_ROOT, 'eval', 'golden.json'), 'utf8'));
  const goldens = golden.goldens as Golden[];

  // 臂定义：full 基线 + 每个 L1 包一个单包臂 + bare（整库摘除）。
  const arms: Arm[] = [
    { name: 'full', exclude: [] },
    ...pkgs.map((p) => ({ name: `no-${p.dir}`, exclude: [p.dir] })),
    { name: 'bare', exclude: pkgs.map((p) => p.dir) },
  ];

  const kbOf = (arm: Arm): string[] =>
    pkgs.filter((p) => !arm.exclude.includes(p.dir)).flatMap((p) => p.chunks.map((c) => c.text));

  // 逐臂逐题判定（mock agent 确定性，单次即可；真 agent 按第 22 章加采样算 pass^k）
  const result = new Map<string, boolean[]>();
  for (const arm of arms) {
    const kb = kbOf(arm);
    result.set(arm.name, goldens.map((g) => passes(g, kb)));
  }

  console.log('消融实验：uplift 矩阵与翻转归因（第 22 章）');
  console.log('='.repeat(64));
  const fullRate = result.get('full')!.filter(Boolean).length / goldens.length;
  const width = Math.max(...arms.map((a) => a.name.length));
  console.log(`${'臂'.padEnd(width)}  ${goldens.map((_, i) => `G${i + 1}`).join('   ')}  通过率  uplift`);
  for (const arm of arms) {
    const r = result.get(arm.name)!;
    const rate = r.filter(Boolean).length / goldens.length;
    const uplift = fullRate - rate;
    const cells = r.map((p) => (p ? 'PASS' : 'FAIL')).join(' ');
    console.log(`${arm.name.padEnd(width)}  ${cells}  ${rate.toFixed(2)}    ${uplift > 0 ? uplift.toFixed(2) : '—'}`);
  }

  console.log('\n翻转归因（单包臂里从 PASS 翻 FAIL 的题 → 该包承重）');
  console.log('='.repeat(64));
  const zeroUplift: KbPackage[] = [];
  for (const p of pkgs) {
    const r = result.get(`no-${p.dir}`)!;
    const flipped = goldens.map((g, i) => (result.get('full')![i] && !r[i] ? `G${i + 1} ${g.question}` : null)).filter(Boolean);
    if (flipped.length > 0) {
      console.log(`${p.dir}：承重 ${flipped.join('；')}`);
    } else {
      zeroUplift.push(p);
      console.log(`${p.dir}：uplift ≈ 0（摘掉不掉分）`);
    }
  }

  if (zeroUplift.length > 0) {
    console.log('\nuplift ≈ 0 的判读（别直接当废弃依据）');
    console.log('='.repeat(64));
    for (const p of zeroUplift) {
      console.log(`${p.dir}：先查 golden 是否覆盖它（第 5 章覆盖度）→ 再查是否被代码或别处冗余知识兜底（第 18 章 extract 的近重复检测）→ 都排除才进废弃流程（第 23 章）`);
    }
  }

  console.log(`\n知识库整体边际贡献（full − bare）：${(fullRate - result.get('bare')!.filter(Boolean).length / goldens.length).toFixed(2)}`);
  console.log('消融是定期体检，不是 CI 门禁——跑在投入与裁撤的决策节点前。');
  return 0;
}
