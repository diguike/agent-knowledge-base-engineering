// 跑同一批组件在不同信任策略下的 trust gate 判定。
// 运行：npx tsx src/main.ts

import { gate, type Component, type TrustPolicy } from './gate';

// 一批要分发的组件：有被动知识，也有会跑代码的，还有一个来自白名单外 marketplace 的。
const components: Component[] = [
  { name: 'aishop-refund 知识文档', type: 'knowledge', marketplace: 'aishop-kb' },
  { name: 'aishop-orders Skill', type: 'knowledge', marketplace: 'aishop-kb' },
  { name: '提交前校验 hook', type: 'hook', marketplace: 'aishop-kb' },
  { name: 'aishop 知识 MCP 服务', type: 'mcp', marketplace: 'aishop-kb' },
  { name: '未知来源的 hook', type: 'hook', marketplace: 'random-marketplace' },
];

function run(label: string, policy: TrustPolicy): void {
  console.log('='.repeat(60));
  console.log(`策略：${label}`);
  console.log(`  工作区信任=${policy.workspaceTrusted}，白名单=${policy.allowedMarketplaces.join(', ')}`);
  for (const c of components) {
    const { verdict, reason } = gate(c, policy);
    console.log(`  [${verdict}] ${c.name}（${c.type}）—— ${reason}`);
  }
  console.log();
}

// 场景一：工作区可信 + 白名单只含 aishop-kb
run('工作区可信', { workspaceTrusted: true, allowedMarketplaces: ['aishop-kb'] });

// 场景二：同样的组件，但工作区未信任
run('工作区未信任', { workspaceTrusted: false, allowedMarketplaces: ['aishop-kb'] });

console.log('='.repeat(60));
console.log('判定规则：白名单外一律拒绝；被动知识直接加载；会跑代码的组件仅工作区可信才启用。');
console.log('这三条对应到 CI，就是流水线该放行还是该失败的依据。');
