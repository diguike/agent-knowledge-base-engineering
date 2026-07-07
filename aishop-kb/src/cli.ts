#!/usr/bin/env -S npx tsx
// aishop-kb —— 统一 CLI 分发器。
// 这是你读完《Agent 知识库工程实战》后拿到的成品：一座知识库 + 一套命令。
// 用法：aishop-kb <command> [args]   或   npx tsx src/cli.ts <command>

const COMMANDS: Record<string, string> = {
  coverage: '语义覆盖度扫描，揪出「有知识没题考」的盲区（第 5 章）',
  serve: '启动知识 MCP 服务（namespace + 角色 ACL + 混合检索）；--smoke 端到端自测（第 10、11 章）',
  promote: '把就地随手记上收成规范 L1 知识条目（第 16 章）',
  check: '知识质量门禁：结构/Diátaxis/文风/死链（第 17 章）',
  extract: '从事故复盘/PR 抽取候选知识 + 冲突/近重复检测（第 18 章）',
  eval: '有效性度量：断言式评测 + pass^k 任务级可靠性（第 21 章）',
  drift: '漂移检测：时间漂移/废弃/一致性（第 22 章）',
  health: '三位一体健康度看板：覆盖度 + 有效性 + 新鲜度（第 22 章）',
};

function usage(): void {
  console.log('aishop-kb —— Agent 知识库工程实战 · 成品 CLI\n');
  console.log('用法：aishop-kb <command> [args]\n');
  console.log('命令：');
  const width = Math.max(...Object.keys(COMMANDS).map((c) => c.length));
  for (const [name, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${name.padEnd(width)}  ${desc}`);
  }
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help') {
    usage();
    process.exit(0);
  }
  let code = 0;
  switch (cmd) {
    case 'coverage':
      code = (await import('./commands/coverage')).run();
      break;
    case 'serve':
      code = await (await import('./commands/serve')).run(rest);
      break;
    case 'promote':
      code = (await import('./commands/promote')).run();
      break;
    case 'check':
      code = (await import('./commands/check')).run();
      break;
    case 'extract':
      code = (await import('./commands/extract')).run();
      break;
    case 'eval':
      code = (await import('./commands/eval')).run();
      break;
    case 'drift':
      code = (await import('./commands/drift')).runDrift();
      break;
    case 'health':
      code = (await import('./commands/drift')).runHealth();
      break;
    default:
      console.error(`未知命令：${cmd}\n`);
      usage();
      code = 2;
  }
  process.exit(code);
}

main();
