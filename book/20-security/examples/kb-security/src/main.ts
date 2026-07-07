// 扫描 kb/ 下所有知识，检测投毒（prompt injection），可疑的拦下送人审。
// 运行：npx tsx src/main.ts

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { detect } from './detect';

const KB = join(import.meta.dirname, '..', 'kb');

console.log('知识投毒检测（扫描 prompt injection 模式）');
console.log('='.repeat(60));

let flagged = 0;
for (const name of readdirSync(KB).sort()) {
  const text = readFileSync(join(KB, name), 'utf8');
  const findings = detect(text);
  if (findings.length === 0) {
    console.log(`[放行] ${name}`);
  } else {
    flagged++;
    console.log(`[拦下·送人审] ${name}`);
    for (const f of findings) console.log(`           └ 命中「${f.pattern}」：${f.matched.trim()}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`${flagged} 条被拦下送人审：poisoned.md 是真投毒，procurement.md 是误报`);
console.log('（「发送到外部供应商系统」是合法集成，却触发了「数据外传」模式）——');
console.log('机器只抓明显特征、分不清真假，靠人审来豁免误报、拦住真投毒。');
console.log('这道检测只是纵深防御的一环，不能替代贡献闸的人审（第 17/18 章）。');
if (flagged > 0) process.exitCode = 1;
