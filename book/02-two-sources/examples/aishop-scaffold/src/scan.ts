// 扫描 aishop 骨架，统计两类知识的起点差异：
// - 代码衍生知识：结构化、可寻址（这里用「导出声明数」近似）
// - 手写业务知识：散落、未结构化（这里用注释里的 BIZ-RULE 标记 + 随手记条目近似）
// 运行：npx tsx src/scan.ts

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..', 'aishop');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(ROOT).sort();

// 代码衍生知识：.ts 文件里的导出声明
let exportedSymbols = 0;
const codeFiles: string[] = [];
for (const f of files.filter((f) => extname(f) === '.ts')) {
  codeFiles.push(relative(ROOT, f));
  // 注：只识别行首单行 export 声明；export default / 多行签名 / export { x } 不计入。
  // 这是简化演示用的近似统计，不是生产级符号提取（那要走编译器/AST）。
  const matches = readFileSync(f, 'utf8').match(/^export\s+(function|const|enum|class|interface|type)\s/gm);
  exportedSymbols += matches?.length ?? 0;
}

// 手写业务知识：注释里的 BIZ-RULE 标记 + notes 随手记条目（未结构化）
let bizInCode = 0;
for (const f of files) {
  const m = readFileSync(f, 'utf8').match(/BIZ-RULE:/g);
  bizInCode += m?.length ?? 0;
}
let bizInNotes = 0;
for (const f of files.filter((f) => f.includes('/notes/'))) {
  const m = readFileSync(f, 'utf8').match(/^\s*-\s+/gm);
  bizInNotes += m?.length ?? 0;
}

console.log('aishop 骨架扫描');
console.log('='.repeat(56));
console.log(`\n代码衍生知识（结构化、可寻址）`);
console.log(`  代码文件：${codeFiles.length} 个 -> ${codeFiles.join(', ')}`);
console.log(`  导出声明：${exportedSymbols} 个（每个都有唯一位置，可被自动抽取/索引）`);

console.log(`\n手写业务知识（散落、未结构化）`);
console.log(`  代码注释里的 BIZ-RULE：${bizInCode} 条（埋在注释里，agent 很难当作知识用）`);
console.log(`  notes 随手记条目：${bizInNotes} 条（连注释都不是，纯口口相传）`);

console.log('\n' + '='.repeat(56));
console.log(
  `起点差异：${exportedSymbols} 个代码符号已经结构化、可寻址；` +
    `而 ${bizInCode + bizInNotes} 条业务知识还散在注释和随手记里，未被结构化。`,
);
console.log('全书要做的，就是把右边这堆「散的」一步步变成可组织、可分发、可治理的知识。');
