// 治理 CI 主流程：漂移检测 → 健康度看板 → 落地路线图。运行：npx tsx src/main.ts
import { detectDrift, healthVerdict, recommendStage, type Profile } from './governance';

// ---- 1. 漂移检测（新鲜度）----
console.log('① 漂移检测');
console.log('='.repeat(56));
const drift = detectDrift();
for (const d of drift) console.log(`  [${d.kind}] ${d.pkg}：${d.detail}`);
console.log(`  共 ${drift.length} 条漂移。`);

// ---- 2. 健康度看板（三位一体）----
console.log('\n② 健康度看板（覆盖度 + 有效性 + 新鲜度）');
console.log('='.repeat(56));
// 覆盖度/有效性在真实管线来自第 5/21 章示例，这里用示例值演示汇总。
const health = { coverage: 85, effectiveness: 90, driftCount: drift.length };
const verdict = healthVerdict(health);
verdict.lines.forEach((l) => console.log('  ' + l));
console.log(`  总判定：${verdict.ok ? '✓ 健康' : '✗ 不健康，CI 标红'}`);

// ---- 3. 落地路线图 ----
console.log('\n③ 落地路线图（按团队画像推荐停在哪一阶）');
console.log('='.repeat(56));
const profiles: { name: string; p: Profile }[] = [
  { name: '个人/单仓库', p: { crossRepo: false, largeOrCrossSource: false, crossTeam: false } },
  { name: '知识要跨仓库复用', p: { crossRepo: true, largeOrCrossSource: false, crossTeam: false } },
  { name: '大规模/跨源问答', p: { crossRepo: true, largeOrCrossSource: true, crossTeam: false } },
  { name: '跨团队规模化', p: { crossRepo: true, largeOrCrossSource: true, crossTeam: true } },
];
for (const { name, p } of profiles) {
  const r = recommendStage(p);
  console.log(`  ${name} → ${r.stage}（${r.why}）`);
}

console.log('\n' + '='.repeat(56));
console.log('把知识库当软件工程：健康度三项进 CI、按需求停在合适一阶——够用就别升级。');
if (!verdict.ok) process.exitCode = 1;
