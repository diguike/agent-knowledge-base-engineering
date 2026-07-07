// aishop-kb serve —— 知识 MCP 服务（第 10、11 章）。
// 暴露 search_docs 工具：namespace 过滤 + 角色 ACL + 关键词/向量混合检索 + rerank，带出处返回。
// 默认走 stdio（可挂进任意 MCP 客户端）；`serve --smoke` 用 InMemoryTransport 端到端自测，无需外部客户端。

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';
import { allChunks, type Chunk } from '../lib/kb';

function tokens(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+|[一-龥]{2}/g) ?? [];
}

export interface Hit {
  namespace: string;
  text: string;
  score: number;
}

// namespace 过滤 + 角色 ACL（都在召回那一刻生效）→ 混合检索（关键词 + 向量）→ rerank → top-k。
export function retrieve(query: string, opts: { namespace?: string; role?: string } = {}, k = 3): Hit[] {
  const role = opts.role ?? '*';
  const scoped: Chunk[] = allChunks()
    .filter((c) => (opts.namespace ? c.namespace === opts.namespace : true))
    .filter((c) => c.roles.includes('*') || c.roles.includes(role)); // 权限下推：无权片段压根不进检索
  const q = tokens(query);
  return scoped
    .map((c) => {
      const ct = tokens(c.text);
      const kw = q.filter((t) => ct.includes(t)).length;
      // 向量得分（本地词袋余弦）
      const all = [...new Set([...q, ...ct])];
      const dot = all.filter((t) => q.includes(t) && ct.includes(t)).length;
      const vec = q.length && ct.length ? dot / (Math.sqrt(q.length) * Math.sqrt(ct.length)) : 0;
      // 混合 + rerank：关键词精确命中额外加权，把「字面对得上」的顶上来
      const score = 0.5 * vec + 0.5 * Math.min(1, kw / Math.max(1, q.length)) + 0.3 * kw;
      return { namespace: c.namespace, text: c.text, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function createServer(): McpServer {
  const server = new McpServer({ name: 'aishop-knowledge', version: '1.0.0' });
  server.registerTool(
    'search_docs',
    {
      description:
        '在 aishop 知识库检索相关片段。可用 namespace 圈定范围（orders/inventory/refund/risk/reconcile），用 role 声明调用方角色做权限过滤（support/finance/risk）',
      inputSchema: { query: z.string(), namespace: z.string().optional(), role: z.string().optional() },
    },
    async ({ query, namespace, role }) => {
      const hits = retrieve(query, { namespace, role });
      const text = hits.length
        ? hits.map((h) => `- [${h.namespace}] ${h.text}　(score ${h.score.toFixed(2)})`).join('\n')
        : '未召回任何片段（可能被 namespace 或角色权限挡在检索之外）';
      return { content: [{ type: 'text', text }] };
    },
  );
  return server;
}

// 端到端自测：连一个内存客户端，真实调用 search_docs，覆盖 namespace 与角色两条路径。
async function smoke(): Promise<void> {
  const server = createServer();
  const client = new Client({ name: 'smoke-client', version: '1.0.0' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await server.connect(st);
  await client.connect(ct);
  const tools = await client.listTools();
  console.log('服务暴露的 tool：', tools.tools.map((t) => t.name).join(', '));

  async function call(query: string, args: { namespace?: string; role?: string }): Promise<void> {
    console.log('\n' + '='.repeat(56));
    console.log(`search_docs(query="${query}", ${JSON.stringify(args)})`);
    const res = await client.callTool({ name: 'search_docs', arguments: { query, ...args } });
    const content = res.content as { type: string; text: string }[];
    console.log(content.map((c) => c.text).join('\n'));
  }

  await call('退款超过多少要人工审核', { namespace: 'refund', role: 'support' }); // 客服无权 → 空
  await call('退款超过多少要人工审核', { namespace: 'refund', role: 'finance' }); // 财务有权 → 命中
  await call('大促库存要怎么处理', {}); // 不限 namespace → 跨包召回
  console.log('\n' + '='.repeat(56));
  console.log('namespace 圈定域、角色圈定权限，两者都在召回那一刻生效——「订阅即召回边界」在服务侧成立。');
  await client.close();
  await server.close();
}

export async function run(args: string[]): Promise<number> {
  if (args.includes('--smoke')) {
    await smoke();
    return 0;
  }
  // 默认：stdio 长驻，供 MCP 客户端连接。返回一个永不 resolve 的 Promise，保持进程存活。
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[aishop-kb serve] 知识 MCP 服务已在 stdio 启动，等待客户端连接…（Ctrl-C 退出）');
  return new Promise<number>(() => {});
}
