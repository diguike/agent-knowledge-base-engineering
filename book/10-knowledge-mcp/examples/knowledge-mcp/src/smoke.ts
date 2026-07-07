// 端到端 smoke：用 InMemoryTransport 把一个 MCP 客户端连上知识服务，真实调用 search_docs。
// 运行：npx tsx src/smoke.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from './server';

const server = createServer();
const client = new Client({ name: 'smoke-client', version: '1.0.0' });
const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
await server.connect(serverTransport);
await client.connect(clientTransport);

// 客户端发现服务暴露了哪些 tool
const tools = await client.listTools();
console.log('服务暴露的 tool：', tools.tools.map((t) => t.name).join(', '));

async function call(query: string, namespace?: string): Promise<void> {
  console.log('\n' + '='.repeat(56));
  console.log(`调用 search_docs(query="${query}"${namespace ? `, namespace="${namespace}"` : ''})`);
  const res = await client.callTool({ name: 'search_docs', arguments: { query, namespace } });
  const content = res.content as { type: string; text: string }[];
  console.log(content.map((c) => c.text).join('\n'));
}

// 1) 限定 namespace=refund：只在退款包里召回
await call('退款超过多少要人工审核', 'refund');
// 2) 不带 namespace：跨包召回
await call('大促库存要怎么处理');

console.log('\n' + '='.repeat(56));
console.log('限定 namespace 时只在该域召回，不限定则跨包——「订阅即召回边界」在服务侧生效。');
await client.close();
await server.close();
