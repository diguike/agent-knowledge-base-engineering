// 对比两种上下文组装策略：全塞 vs 常驻 L0 + 按需检索。
// 运行：npx tsx src/main.ts

import { assembleSmart, assembleStuffAll, BUDGET, relevance, type Assembly } from './assemble';

const QUERY = '写退款接口的风控校验';
console.log(`任务：${QUERY}`);
console.log(`上下文知识预算：${BUDGET} tokens`);

function report(name: string, a: Assembly): void {
  console.log('\n' + '='.repeat(60));
  console.log(`策略：${name}`);
  for (const k of a.injected) {
    const rel = relevance(k, QUERY);
    console.log(`  [${k.layer}] ${k.text}　(${k.tokens} tok, 相关度 ${rel})`);
  }
  console.log(`  合计 ${a.totalTokens} tokens　${a.overBudget ? '✗ 超预算！' : '✓ 在预算内'}`);
}

// 策略 A：全塞
report('全塞（所有知识都常驻）', assembleStuffAll());

// 策略 B：常驻 L0 + 按需检索相关的
report('常驻 L0 + 按需检索', assembleSmart(QUERY));

console.log('\n' + '='.repeat(60));
console.log('全塞超了预算、还塞进大促库存/对账这些和退款无关的知识（相关度 0）；');
console.log('常驻 L0 + 按需检索在预算内只放了必须的约定 + 最相关的退款/风控两条。');
console.log('知识和代码争上下文——目标是「准」不是「多」。');
