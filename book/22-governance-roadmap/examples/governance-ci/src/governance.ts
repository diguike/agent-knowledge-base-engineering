// 治理 CI：漂移检测（新鲜度）+ 三位一体健康度看板 + 落地路线图推荐。

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const REF_DATE = new Date('2026-07-06');
const TTL_DAYS = 90;

function frontmatter(path: string): Record<string, string> {
  const m = readFileSync(path, 'utf8').match(/^---\n([\s\S]*?)\n---/);
  const fm: Record<string, string> = {};
  if (m) for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}

export interface DriftIssue {
  pkg: string;
  kind: '时间漂移' | '废弃仍在库' | '一致性漂移';
  detail: string;
}

// 代码里退款阈值的真实值（现行规则，模拟从代码抽取）。知识里若和它对不上，就是一致性漂移。
const CODE_REFUND_THRESHOLD = 5000;

// 漂移检测：时间漂移（last_reviewed 超 TTL）+ 废弃仍在库 + 一致性漂移（知识值 vs 代码值）。
export function detectDrift(): DriftIssue[] {
  const issues: DriftIssue[] = [];
  const L1 = join(ROOT, 'kb', 'L1');
  for (const pkg of readdirSync(L1)) {
    const path = join(L1, pkg, 'knowledge.md');
    const fm = frontmatter(path);
    if (fm.last_reviewed) {
      const age = (REF_DATE.getTime() - new Date(fm.last_reviewed).getTime()) / 86400000;
      if (age > TTL_DAYS) issues.push({ pkg, kind: '时间漂移', detail: `last_reviewed 已 ${Math.round(age)} 天 > TTL ${TTL_DAYS}` });
    }
    if (fm.status === 'deprecated') issues.push({ pkg, kind: '废弃仍在库', detail: 'status=deprecated，应下线或迁移下游' });
    // 一致性漂移：退款知识里的阈值和代码实际值对不上
    if (pkg === 'kb-refund') {
      const m = readFileSync(path, 'utf8').match(/退款超过\s*(\d+)/);
      if (m && Number(m[1]) !== CODE_REFUND_THRESHOLD) {
        issues.push({ pkg, kind: '一致性漂移', detail: `知识说阈值 ${m[1]}，但代码里已是 ${CODE_REFUND_THRESHOLD}` });
      }
    }
  }
  return issues;
}

// 健康度看板：三位一体。覆盖度/有效性在真实管线里来自第5/21章，这里用示例值。
export interface Health {
  coverage: number; // 覆盖度 %（第5章）
  effectiveness: number; // 有效性通过率 %（第21章）
  driftCount: number; // 新鲜度：漂移条数（本章）
}
export function healthVerdict(h: Health): { ok: boolean; lines: string[] } {
  const lines = [
    `覆盖度（该有的有没有）：${h.coverage}%　${h.coverage >= 80 ? '✓' : '✗'}`,
    `有效性（准不准）：${h.effectiveness}%　${h.effectiveness >= 85 ? '✓' : '✗'}`,
    `新鲜度（过期没有）：${h.driftCount} 条漂移　${h.driftCount === 0 ? '✓' : '✗'}`,
  ];
  const ok = h.coverage >= 80 && h.effectiveness >= 85 && h.driftCount === 0;
  return { ok, lines };
}

// 落地路线图：按团队画像推荐停在哪一阶。
export interface Profile {
  crossRepo: boolean; // 知识要跨仓库复用
  largeOrCrossSource: boolean; // 大规模/跨源/需语义问答
  crossTeam: boolean; // 跨团队规模化分发
}
export function recommendStage(p: Profile): { stage: string; why: string } {
  if (p.crossTeam) return { stage: '阶段3（第12-14章）', why: '跨团队、多 agent 工具复用同一批知识' };
  if (p.largeOrCrossSource) return { stage: '阶段2（第10-11章）', why: '大规模/跨源/需要语义问答' };
  if (p.crossRepo) return { stage: '阶段1（第8-9章）', why: '知识要跨仓库复用' };
  return { stage: '阶段0（第6章）', why: '单仓库/小团队，文件夹+llms.txt 够用' };
}
