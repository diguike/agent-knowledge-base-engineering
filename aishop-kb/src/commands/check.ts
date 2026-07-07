// aishop-kb check —— 知识质量门禁（第 17 章）。
// 四层客观检查：结构/元数据、Diátaxis 单型、prose lint（AI 味道）、死链。
// 机器先筛掉客观问题，CODEOWNERS 只审筛不掉的内容。有问题非零退出，可进 CI。

import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { parseFrontmatter, REQUIRED_FIELDS, DIATAXIS } from '../lib/frontmatter';
import { listMarkdown, KB_ROOT } from '../lib/kb';

const AI_TASTE = ['让我们来探索', '值得注意的是', '不难发现', '显而易见', '众所周知'];

interface Issue {
  gate: string;
  msg: string;
}

function checkEntry(path: string): Issue[] {
  const { fm, body } = parseFrontmatter(path);
  const issues: Issue[] = [];

  // ① 结构/元数据：五字段齐不齐
  for (const f of REQUIRED_FIELDS) if (!fm[f]) issues.push({ gate: '结构/元数据', msg: `缺字段 ${f}` });

  // ② Diátaxis 单型：type 合法
  if (fm.type && !DIATAXIS.includes(fm.type)) {
    issues.push({ gate: 'Diátaxis 单型', msg: `type「${fm.type}」非法（应为 ${DIATAXIS.join('/')}）` });
  }

  // ③ prose lint：AI 味道黑名单
  for (const bad of AI_TASTE) if (body.includes(bad)) issues.push({ gate: 'prose lint', msg: `命中 AI 套话「${bad}」` });

  // ④ 死链：正文里 [x](相对路径) 指向的本地文件是否存在
  for (const lm of body.matchAll(/\[[^\]]+\]\((\.[^)]+)\)/g)) {
    if (!existsSync(join(dirname(path), lm[1]))) issues.push({ gate: '死链', msg: `链接失效：${lm[1]}` });
  }
  return issues;
}

export function run(): number {
  console.log('知识质量门禁（结构/元数据 · Diátaxis 单型 · prose lint · 死链）（第 17 章）');
  console.log('='.repeat(64));
  let failed = 0;
  for (const file of listMarkdown().sort()) {
    const rel = relative(KB_ROOT, file);
    const issues = checkEntry(file);
    if (issues.length === 0) {
      console.log(`[PASS] ${rel}`);
    } else {
      failed++;
      console.log(`[FAIL] ${rel}`);
      for (const i of issues) console.log(`         └ [${i.gate}] ${i.msg}`);
    }
  }
  console.log('\n' + '='.repeat(64));
  console.log(
    failed === 0
      ? '全部通过——kb 结构健康，CODEOWNERS 可以只审内容对不对。'
      : `${failed} 条被门禁拦下——机器筛掉客观问题，CODEOWNERS 只审剩下的。`,
  );
  return failed > 0 ? 1 : 0;
}
