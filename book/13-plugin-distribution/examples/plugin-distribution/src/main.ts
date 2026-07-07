// 演示 plugin 依赖解析（传递依赖自动带上）+ prune（识别孤儿）。
// 运行：npx tsx src/main.ts

import { loadEnabled, loadMarketplace, prune, resolveInstallSet } from './resolve';

const market = loadMarketplace();
const enabled = loadEnabled();

console.log('settings.json 声明的 enabledPlugins（顶层启用项）：', enabled.join(', '));

// 1) 解析完整安装集：顺着依赖图把传递依赖带上
const installSet = resolveInstallSet(enabled, market);
console.log('\n依赖解析后实际会装上的完整集合：');
for (const name of installSet) {
  const deps = market.get(name)!.dependencies;
  console.log(`  - ${name}${deps.length ? `（依赖 ${deps.join(', ')}）` : ''}`);
}
console.log(`\n你只在 enabledPlugins 里写了 ${enabled.join(', ')}，`);
console.log(`解析器顺着依赖图自动带上了传递依赖，共装 ${installSet.size} 个。`);

// 2) prune：模拟环境里多装了一个不再被依赖的包
const installed = [...installSet, 'aishop-inventory']; // 手动多装了一个
console.log('\n' + '='.repeat(56));
console.log('假设环境里已装：', installed.join(', '));
const orphans = prune(installed, enabled, market);
console.log(`prune 识别出的孤儿（不再被任何启用项依赖）：${orphans.join(', ') || '无'}`);
console.log('-> plugin prune 会把这些孤儿清理掉，回收它们占的上下文。');

console.log('\n' + '='.repeat(56));
console.log('声明顶层需要什么，传递依赖自动装、孤儿自动识别——这就是 npm 式依赖图的分发管理。');
