// 冷启动分诊：对每份存量文档判断「迁移 / 接入 / 丢弃」，
// 把该迁移的写进 aishop/docs/，输出分诊报告。
// 运行：npx tsx src/triage.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { legacyDocs, type LegacyDoc } from './data';

// 用固定参考日期，保证分诊结果可复现（不依赖运行当天的系统时钟）。
const REFERENCE_DATE = new Date('2026-07-06');
const ONE_YEAR_MS = 365 * 24 * 3600 * 1000;

// aishop 的业务模块关键词——命中则认为「和本系统代码强相关」。
const AISHOP_KEYWORDS = ['订单', '状态机', '库存', '退款', '风控', '对账', '支付'];

type Verdict = '迁移' | '接入' | '丢弃';

function triage(doc: LegacyDoc): { verdict: Verdict; reason: string } {
  const ageMs = REFERENCE_DATE.getTime() - new Date(doc.lastModified).getTime();
  if (ageMs > ONE_YEAR_MS) return { verdict: '丢弃', reason: '超过一年未更新，大概率过期' };
  if (!doc.owner) return { verdict: '丢弃', reason: '无 owner，无人认领' };
  if (doc.content.includes('已') && doc.content.includes('下线')) return { verdict: '丢弃', reason: '内容涉及已下线功能' };
  const related = AISHOP_KEYWORDS.some((k) => doc.content.includes(k) || doc.title.includes(k));
  if (related) return { verdict: '迁移', reason: '有效且与 aishop 代码强相关，值得治理' };
  return { verdict: '接入', reason: '有效但别处维护更合适，挂 MCP 端点即可' };
}

function slug(doc: LegacyDoc): string {
  return doc.id + '-' + doc.title.replace(/[^一-龥a-zA-Z0-9]/g, '');
}

const docsDir = join(import.meta.dirname, '..', 'aishop', 'docs');
mkdirSync(docsDir, { recursive: true });

const buckets: Record<Verdict, string[]> = { 迁移: [], 接入: [], 丢弃: [] };
console.log('冷启动分诊报告');
console.log('='.repeat(64));
for (const doc of legacyDocs) {
  const { verdict, reason } = triage(doc);
  buckets[verdict].push(doc.title);
  console.log(`[${verdict}] ${doc.title}（${doc.source}, ${doc.lastModified}, owner=${doc.owner ?? '无'}）`);
  console.log(`         理由：${reason}`);
  if (verdict === '迁移') {
    // 迁移进 docs/：清洗后写成文件（真实项目还要补 frontmatter、登记进 llms.txt）
    writeFileSync(join(docsDir, slug(doc) + '.md'), `# ${doc.title}\n\n${doc.content}\n`, 'utf8');
  }
}

console.log('\n' + '='.repeat(64));
console.log(`迁移 ${buckets.迁移.length} 份 -> 已写入 aishop/docs/：${buckets.迁移.join('、')}`);
console.log(`接入 ${buckets.接入.length} 份（留原系统挂 MCP）：${buckets.接入.join('、')}`);
console.log(`丢弃 ${buckets.丢弃.length} 份（僵尸文档，清出去）：${buckets.丢弃.join('、')}`);
console.log('\n冷启动的价值不在搬得快，而在筛得准：该治理的沉淀进 git，该淘汰的清出去。');
