// 对照：同一个「退款」问题，在声明了不同依赖的两个仓库里，召回范围不同。
// 运行：npx tsx src/compare.ts

import { loadScope, parseDeps, query } from './loader';

const QUESTION = '退款金额超过多少要人工审核';

for (const repo of ['aishop', 'search-svc']) {
  console.log('='.repeat(56));
  console.log(`仓库：${repo}`);
  console.log(`L2 声明依赖：${parseDeps(repo).join(', ') || '（无）'}`);
  const scope = loadScope(repo);
  console.log(`加载范围：${scope.map((d) => `${d.layer}:${d.pkg}`).join(' | ')}`);
  const hit = query(repo, QUESTION);
  console.log(`\n问「${QUESTION}」：`);
  if (hit) {
    console.log(`  ✓ 命中 ${hit.hitPkg}：${hit.line}`);
  } else {
    console.log(`  ✗ 未召回——退款知识（kb-refund）不在本仓库的依赖范围内，压根没加载进来。`);
  }
  console.log();
}

console.log('='.repeat(56));
console.log('同一个问题，aishop 能召回退款规则，search-svc 查不到——');
console.log('不是被过滤掉的，而是依赖声明从一开始就把召回范围圈定了。这就是「裁剪 = 选择性依赖」。');
