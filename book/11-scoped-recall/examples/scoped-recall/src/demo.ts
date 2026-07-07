// 同一个退款审核问题，分别以「客服」和「财务」角色调用，展示权限在召回阶段生效。
// 运行：npx tsx src/demo.ts

import { retrieve } from './retrieval-acl';

const QUESTION = '退款超过多少要人工审核';

for (const role of ['support', 'finance']) {
  console.log('='.repeat(56));
  console.log(`角色 = ${role}　问「${QUESTION}」（namespace=refund）`);
  const hits = retrieve(QUESTION, { namespace: 'refund', role });
  if (hits.length === 0) {
    console.log('  召回为空——该角色无权访问相关片段，在召回阶段就被挡住了。');
  } else {
    hits.forEach((h) => console.log(`  ✓ [${h.namespace}] ${h.text}`));
  }
  console.log();
}

console.log('='.repeat(56));
console.log('财务能召回审核细则，客服召回为空——权限是在召回那一刻生效的，不是事后过滤。');
console.log('（同时挂自建服务 + GitMCP 端点的客户端配置见 clients.example.json）');
