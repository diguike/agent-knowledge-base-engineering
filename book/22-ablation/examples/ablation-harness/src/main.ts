// 消融实验编排：物化实验臂 → 逐臂逐题多次采样 → uplift / 翻转归因 / pass^k / 成本报告。
// 运行：npx tsx src/main.ts（加 --keep 保留臂目录以便检查）
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { arms, TRIALS } from './arms';
import { goldens } from './goldens';
import { answerQuestion } from './agent';
import { assertAnswer, passHatK } from './score';
import { buildBaseRepo, materializeArm, cleanup } from './materialize';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, '..', 'fixture', 'aishop');
const keep = process.argv.includes('--keep');

const workRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-ablation-'));
const base = buildBaseRepo(fixture, workRoot);
console.log(`基线仓库：${base}（git worktree 切臂）\n`);

interface Cell {
  success: number; // TRIALS 次里过了几次
  avgBytes: number; // 平均每次作答读取的字节数
}
const results = new Map<string, Map<string, Cell>>();

for (const arm of arms) {
  const armDir = materializeArm(base, workRoot, arm);
  const perGolden = new Map<string, Cell>();
  for (const g of goldens) {
    let success = 0;
    let bytes = 0;
    for (let t = 0; t < TRIALS; t++) {
      const r = answerQuestion(armDir, g.question, `${arm.name}/${g.id}/${t}`);
      if (assertAnswer(r.answer, g)) success++;
      bytes += r.bytesRead;
    }
    perGolden.set(g.id, { success, avgBytes: bytes / TRIALS });
  }
  results.set(arm.name, perGolden);
}

const armRate = (name: string): number => {
  const per = results.get(name)!;
  let s = 0;
  for (const g of goldens) s += per.get(g.id)!.success;
  return s / (goldens.length * TRIALS);
};
const fullRate = armRate('full');

// ---- 1. 通过率矩阵与 uplift ----
console.log('一、通过率矩阵（每格 = 通过次数/采样次数）与 uplift');
console.log('='.repeat(72));
console.log(['臂'.padEnd(14), ...goldens.map((g) => g.id), '均值', 'uplift(相对全量)'].join('  '));
for (const arm of arms) {
  const per = results.get(arm.name)!;
  const cells = goldens.map((g) => `${per.get(g.id)!.success}/${TRIALS}`);
  const rate = armRate(arm.name);
  const uplift = fullRate - rate;
  console.log(
    [arm.name.padEnd(14), ...cells, rate.toFixed(2), uplift > 0 ? uplift.toFixed(2) : '—'].join('  '),
  );
}
console.log(`\n知识库整体边际贡献 = full 与 bare 的差值：${(fullRate - armRate('bare')).toFixed(2)}`);

// ---- 2. 翻转归因：哪道题在哪个臂翻了，承重知识是什么 ----
console.log('\n二、翻转归因（相对全量臂从稳过变为不稳/不过的题）');
console.log('='.repeat(72));
for (const g of goldens) {
  const fullSuccess = results.get('full')!.get(g.id)!.success;
  const flipped = arms
    .filter((a) => a.name !== 'full' && results.get(a.name)!.get(g.id)!.success < fullSuccess)
    .map((a) => `${a.name}(${results.get(a.name)!.get(g.id)!.success}/${TRIALS})`);
  console.log(`${g.id} ${g.question}`);
  console.log(`    翻转于：${flipped.length ? flipped.join('、') : '未翻转（各臂都能答）'}`);
  console.log(`    承重知识：${g.knowledge}`);
}

// ---- 3. 兜底稳定性：G1 的 pass^k ----
console.log('\n三、pass^k 看兜底稳定性（G1 退款阈值）');
console.log('='.repeat(72));
for (const arm of arms) {
  const s = results.get(arm.name)!.get('G1')!.success;
  const line = [1, 2, 3].map((k) => `pass^${k}=${passHatK(s, TRIALS, k).toFixed(2)}`).join('  ');
  console.log(`${arm.name.padEnd(14)} ${line}`);
}

// ---- 4. 检索成本 ----
console.log('\n四、平均每次作答读取字节数（检索成本）');
console.log('='.repeat(72));
for (const arm of arms) {
  const per = results.get(arm.name)!;
  const avg = goldens.reduce((s, g) => s + per.get(g.id)!.avgBytes, 0) / goldens.length;
  console.log(`${arm.name.padEnd(14)} ${Math.round(avg)} B`);
}

// ---- 5. 治理提示：零归因 ≠ 无用，先查 golden 覆盖 ----
console.log('\n五、治理提示');
console.log('='.repeat(72));
const docsDir = path.join(fixture, 'docs');
for (const f of fs.readdirSync(docsDir)) {
  const rel = `docs/${f}`;
  if (!goldens.some((g) => g.knowledge.includes(rel))) {
    console.log(`${rel}：没有任何 golden 覆盖它，本次消融测不出它的贡献。`);
    console.log('    uplift 未知 ≠ uplift 为零——先补覆盖度（第 5 章），再谈废弃（第 23 章）。');
  }
}

if (keep) {
  console.log(`\n--keep：臂目录保留在 ${path.join(workRoot, 'arms')}`);
} else {
  cleanup(base, workRoot);
}
