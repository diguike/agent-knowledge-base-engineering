// aishop-kb drift / health —— 治理 CI（第 23 章）。
// drift：漂移检测（时间漂移 + 废弃仍在库 + 一致性漂移）。
// health：三位一体健康度看板（覆盖度 + 有效性 + 新鲜度），任一不达标判红。

import { readFileSync } from 'node:fs';
import { loadPackages, REF_DATE } from '../lib/kb';
import { run as runCoverage } from './coverage';
import { run as runEval } from './eval';

const TTL_DAYS = 90;
// 代码里退款阈值的真实值（模拟从代码抽取）。知识里若和它对不上，就是一致性漂移。
const CODE_REFUND_THRESHOLD = 5000;

interface DriftIssue {
  pkg: string;
  kind: '时间漂移' | '废弃仍在库' | '一致性漂移';
  detail: string;
}

export function detectDrift(): DriftIssue[] {
  const issues: DriftIssue[] = [];
  for (const pkg of loadPackages()) {
    const fm = pkg.fm;
    if (fm.last_reviewed) {
      const age = (REF_DATE.getTime() - new Date(fm.last_reviewed).getTime()) / 86400000;
      if (age > TTL_DAYS) issues.push({ pkg: pkg.dir, kind: '时间漂移', detail: `last_reviewed 已 ${Math.round(age)} 天 > TTL ${TTL_DAYS}` });
    }
    if (fm.status === 'deprecated') issues.push({ pkg: pkg.dir, kind: '废弃仍在库', detail: 'status=deprecated，应下线或迁移下游' });
    // 一致性漂移：退款知识里的阈值和代码实际值对不上
    if (pkg.namespace === 'refund') {
      const m = readFileSync(pkg.mdPath, 'utf8').match(/退款金额超过\s*(\d+)/);
      if (m && Number(m[1]) !== CODE_REFUND_THRESHOLD) {
        issues.push({ pkg: pkg.dir, kind: '一致性漂移', detail: `知识说阈值 ${m[1]}，但代码里已是 ${CODE_REFUND_THRESHOLD}` });
      }
    }
  }
  return issues;
}

export function runDrift(): number {
  console.log('漂移检测（时间漂移 · 废弃仍在库 · 一致性漂移）（第 23 章）');
  console.log('='.repeat(56));
  const drift = detectDrift();
  if (drift.length === 0) {
    console.log('  未检出漂移——所有知识包在 TTL 内、无废弃残留、退款阈值与代码一致。');
  } else {
    for (const d of drift) console.log(`  [${d.kind}] ${d.pkg}：${d.detail}`);
  }
  console.log(`\n共 ${drift.length} 条漂移。CI 门禁：${drift.length === 0 ? '通过' : '判红'}`);
  return drift.length === 0 ? 0 : 1;
}

// health：三位一体看板。实跑覆盖度和有效性两条子管线取真实结果，再叠加漂移条数。
export function runHealth(): number {
  console.log('健康度看板（覆盖度 + 有效性 + 新鲜度）（第 23 章）');
  console.log('='.repeat(56));
  console.log('（下方三项分别实跑 coverage / eval / drift 子管线取真实结果，输出从略，只汇总判定）\n');

  // 静默跑子管线，只取通过与否
  const silence = () => {};
  const orig = console.log;
  console.log = silence as typeof console.log;
  const coverageOk = runCoverage() === 0;
  const evalOk = runEval() === 0;
  const driftCount = detectDrift().length;
  console.log = orig;

  const lines = [
    `覆盖度（该有的有没有）：${coverageOk ? '✓ 达标' : '✗ 未达标'}`,
    `有效性（准不准）：${evalOk ? '✓ 达标' : '✗ 未达标'}`,
    `新鲜度（过期没有）：${driftCount} 条漂移　${driftCount === 0 ? '✓' : '✗'}`,
  ];
  lines.forEach((l) => console.log('  ' + l));
  const ok = coverageOk && evalOk && driftCount === 0;
  console.log(`\n  总判定：${ok ? '✓ 健康' : '✗ 不健康，CI 标红'}`);
  console.log('\n把知识库当软件工程：健康度三项一起进 CI，任一红则流水线红。');
  return ok ? 0 : 1;
}

export function run(args: string[]): number {
  return args.includes('health') ? runHealth() : runDrift();
}
