// 知识 MCP 服务：注册 search_docs 工具，按 namespace 过滤 + 混合检索 + rerank，带出处返回。
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { retrieve } from './retrieval';

export function createServer(): McpServer {
  const server = new McpServer({ name: 'aishop-knowledge', version: '1.0.0' });

  server.registerTool(
    'search_docs',
    {
      description: '在 aishop 知识库检索相关片段，可用 namespace 圈定范围（orders / inventory / refund）',
      inputSchema: { query: z.string(), namespace: z.string().optional() },
    },
    async ({ query, namespace }) => {
      const hits = retrieve(query, namespace);
      const text = hits.length
        ? hits.map((h) => `- [${h.namespace}] ${h.text}　(score ${h.score.toFixed(2)})`).join('\n')
        : '未召回任何片段';
      return { content: [{ type: 'text', text }] };
    },
  );

  return server;
}
